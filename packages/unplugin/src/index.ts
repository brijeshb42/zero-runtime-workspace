import * as path from 'node:path';
import {
  UnpluginFactoryOutput,
  WebpackPluginInstance,
  createUnplugin,
  VitePlugin,
} from 'unplugin';
import { transformAsync } from '@babel/core';
import type {
  PluginOptions as LinariaPluginOptions,
  Preprocessor,
} from '@linaria/babel-preset';
import { TransformCacheCollection, transform } from '@linaria/babel-preset';
import { createPerfMeter, asyncResolveFallback, slugify } from '@linaria/utils';
import {
  generateCss,
  preprocessor as basePreprocessor,
} from '@mui/zero-runtime/utils';

export type PluginOptions<Theme = unknown> = {
  theme: Theme;
  cssVariablesPrefix?: string;
  /**
   * Whether the css variables for the default theme should target the :root selector or not.
   * @default true
   */
  injectDefaultThemeInRoot?: boolean;
  transformLibraries?: string[];
  preprocessor?: Preprocessor;
  debug?: boolean;
  sourceMap?: boolean;
  asyncResolve?: (what: string) => string | null;
} & Partial<LinariaPluginOptions>;

const extensions = [
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
];

function hasCorectExtension(fileName: string) {
  return extensions.some((ext) => fileName.endsWith(ext));
}

const VIRTUAL_CSS_FILE = `\0zero-runtime-styles.css`;

function isZeroRuntimeThemeFile(fileName: string) {
  return fileName === VIRTUAL_CSS_FILE;
}

function isZeroRuntimeProcessableFile(
  fileName: string,
  transformLibraries: string[]
) {
  const isNodeModule = fileName.includes('node_modules');
  const isTransformableFile =
    isNodeModule &&
    transformLibraries.some((libName) => fileName.includes(libName));
  return (
    hasCorectExtension(fileName) &&
    (isTransformableFile || !isNodeModule) &&
    !fileName.includes('runtime/dist')
  );
}

// Need to make it global because Next.js initializes the plugin
// multiple times during the build process.
const cssLookup = new Map<string, string>();
const cssFileLookup = new Map<string, string>();

export const plugin = createUnplugin<PluginOptions, true>((options) => {
  const {
    theme,
    cssVariablesPrefix = 'mui',
    injectDefaultThemeInRoot = true,
    transformLibraries = [],
    preprocessor = basePreprocessor,
    asyncResolve: asyncResolveOpt,
    debug = false,
    sourceMap = false,
    ...rest
  } = options;
  const themeArgs = { theme };
  const linariaOptions = {
    themeArgs: {
      theme,
    },
    cssVariablesPrefix,
    ...rest,
  };
  const cache = new TransformCacheCollection();
  const { emitter, onDone } = createPerfMeter(debug);

  return [
    {
      name: 'zero-plugin-styles-css',
      enforce: 'pre',
      resolveId(source) {
        if (source === '@mui/zero-runtime/styles.css') {
          return VIRTUAL_CSS_FILE;
        }
        return null;
      },
      loadInclude(id) {
        return isZeroRuntimeThemeFile(id);
      },
      load() {
        return generateCss(
          { themeArgs, cssVariablesPrefix },
          {
            injectInRoot: injectDefaultThemeInRoot,
          }
        );
      },
    },
    {
      name: 'zero-plugin-transform-babel',
      enforce: 'post',
      transformInclude(id) {
        return isZeroRuntimeProcessableFile(id, transformLibraries);
      },
      async transform(code, id) {
        const result = await transformAsync(code, {
          filename: id,
          babelrc: false,
          configFile: false,
          plugins: [['@mui/zero-runtime/exports/sx-plugin']],
        });
        if (!result) {
          return null;
        }
        return {
          code: result.code ?? code,
          map: result.map,
        };
      },
    },
    {
      name: 'zero-plugin-load-output-css',
      enforce: 'pre',
      resolveId(importeeUrl: string) {
        return cssFileLookup.get(importeeUrl);
      },
      loadInclude(id) {
        return id.endsWith('.zero.css');
      },
      load(id) {
        return cssLookup.get(id) ?? '';
      },
    },
    {
      name: 'zero-plugin-transform-linaria',
      enforce: 'post',
      buildEnd() {
        onDone(process.cwd());
      },
      transformInclude(id) {
        return isZeroRuntimeProcessableFile(id, transformLibraries);
      },
      async transform(code, id) {
        const asyncResolve: typeof asyncResolveFallback = async (
          what,
          importer,
          stack
        ) => {
          const result = asyncResolveOpt?.(what);
          if (typeof result === 'string') {
            return result;
          }
          return await asyncResolveFallback(what, importer, stack);
        };
        const result = await transform(
          code,
          {
            filename: id,
            preprocessor,
            pluginOptions: linariaOptions,
          },
          asyncResolve,
          {},
          cache,
          emitter
        );
        let { cssText } = result;
        if (!cssText) {
          return null;
        }

        const slug = slugify(cssText);
        // const cssFilename = path
        //   .normalize(`${id.replace(/\.[jt]sx?$/, '')}_${slug}.zero.css`)
        //   .replace(/\\/g, path.posix.sep);
        const cssFilename = `${path.parse(id).name}_${slug}.zero.css`;

        const cssRelativePath = path
          .relative(process.cwd(), cssFilename)
          .replace(/\\/g, path.posix.sep);

        const cssId = `./${cssRelativePath}`;

        if (sourceMap && result.cssSourceMapText) {
          const map = Buffer.from(result.cssSourceMapText).toString('base64');
          cssText += `/*# sourceMappingURL=data:application/json;base64,${map}*/`;
        }

        cssLookup.set(cssFilename, cssText);
        cssFileLookup.set(cssId, cssFilename);
        return {
          code: `import ${JSON.stringify(`./${cssFilename}`)};\n${result.code}`,
          map: result.sourceMap,
        };
      },
    },
  ];
});

export const webpack = plugin.webpack as unknown as UnpluginFactoryOutput<
  PluginOptions,
  WebpackPluginInstance
>;
export const vite = plugin.vite as unknown as UnpluginFactoryOutput<
  PluginOptions,
  VitePlugin
>;
