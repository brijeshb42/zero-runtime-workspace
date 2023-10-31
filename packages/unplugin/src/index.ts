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

type NextMeta = {
  type: 'next';
  dev: boolean;
  isServer: boolean;
  outputCss: boolean;
};

type ViteMeta = {
  type: 'vite';
};

type WebpackMeta = {
  type: 'webpack';
};

type Meta = NextMeta | ViteMeta | WebpackMeta;

export type PluginOptions<Theme = unknown> = {
  theme: Theme;
  cssVariablesPrefix?: string;
  injectDefaultThemeInRoot?: boolean;
  transformLibraries?: string[];
  preprocessor?: Preprocessor;
  debug?: boolean;
  sourceMap?: boolean;
  meta?: Meta;
  asyncResolve?: (what: string) => string | null;
  writeCache?: (data: string) => Promise<void>;
  restoreCache?: () => Promise<string>;
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
  transformLibraries: string[],
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

/**
 * Next.js initializes the plugin multiple times. So all the calls
 * have to share the same Maps.
 */
const globalCssFileLookup = new Map<string, string>();
const globalCssLookup = new Map<string, string>();

export const plugin = createUnplugin<PluginOptions, true>((options) => {
  const {
    theme,
    meta,
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
  const cssLookup =
    meta?.type === 'next' ? globalCssLookup : new Map<string, string>();
  const cssFileLookup =
    meta?.type === 'next' ? globalCssFileLookup : new Map<string, string>();

  return [
    {
      name: 'zero-plugin-theme-tokens',
      enforce: 'pre',
      resolveId(source: string) {
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
          },
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
          stack,
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
          emitter,
        );
        let { cssText } = result;
        if (!cssText || (meta?.type === 'next' && !meta.outputCss)) {
          return {
            code: result.code,
            map: result.sourceMap,
          };
        }

        const slug = slugify(cssText);
        const cssFilename = `${slug}.zero.css`;
        const cssId = `./${cssFilename}`;

        if (sourceMap && result.cssSourceMapText) {
          const map = Buffer.from(result.cssSourceMapText).toString('base64');
          cssText += `/*# sourceMappingURL=data:application/json;base64,${map}*/`;
        }

        cssFileLookup.set(cssId, cssFilename);
        cssLookup.set(cssFilename, cssText);
        return {
          code: `import ${JSON.stringify(`./${cssFilename}`)};\n${result.code}`,
          map: result.sourceMap,
        };
      },
    },
    {
      name: 'zero-plugin-load-output-css',
      enforce: 'pre',
      resolveId(source: string) {
        return cssFileLookup.get(source);
      },
      loadInclude(id) {
        return id.endsWith('.zero.css');
      },
      load(id) {
        return cssLookup.get(id) ?? '';
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
