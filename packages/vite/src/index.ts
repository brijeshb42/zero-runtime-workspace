import type { Plugin } from 'vite';
import { preprocessor as basePreprocessor } from '@mui/zero-runtime/utils';
import { transformAsync } from '@babel/core';
import { Interpolation, serializeStyles } from '@emotion/serialize';
import baseZeroVitePlugin, { type VitePluginOptions } from './zero-vite-plugin';

type BaseTheme = {
  cssVarPrefix: string;
  colorSchemes: Record<string, unknown>;
  generateCssVars: (colorScheme?: string) => { css: Record<string, string> };
};

export interface ZeroVitePluginOptions extends VitePluginOptions {
  /**
   * The theme object that you want to be passed to the `styled` function
   */
  theme: BaseTheme;
}

const VIRTUAL_CSS_FILE = `\0zero-runtime-styles.css`;
const VIRTUAL_THEME_FILE = `\0zero-runtime-theme.js`;

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

export function zeroVitePlugin(options: ZeroVitePluginOptions) {
  const {
    theme,
    babelOptions = {},
    preprocessor = basePreprocessor,
    transformLibraries = [],
    ...rest
  } = options ?? {};

  // create stylesheet as object
  const stylesheetObj: Interpolation<unknown> = {
    ':root': theme.generateCssVars().css,
  };
  Object.entries(theme.colorSchemes).forEach(([key]) => {
    stylesheetObj[
      `${key === 'light' ? ':root, ' : ''}[data-${
        theme.cssVarPrefix
      }-color-scheme="${key}"]`
    ] = theme.generateCssVars(key).css;
  });

  // use emotion to serialize the object to css string
  const { styles: stylesheet } = serializeStyles([stylesheetObj]);

  function injectMUITokensPlugin(): Plugin {
    return {
      name: 'vite-mui-theme-injection-plugin',
      enforce: 'pre',
      resolveId(source) {
        if (source === '@mui/zero-runtime/styles.css') {
          return VIRTUAL_CSS_FILE;
        } else if (source === '@mui/zero-runtime/theme') {
          return VIRTUAL_THEME_FILE;
        }
        return null;
      },
      load(id) {
        if (id === VIRTUAL_CSS_FILE) {
          return stylesheet;
        } else if (id === VIRTUAL_THEME_FILE) {
          return `export default ${JSON.stringify(theme)};`;
        }
        return null;
      },
    };
  }

  function intermediateBabelPlugin(): Plugin {
    return {
      name: 'vite-mui-zero-intermediate-plugin',
      enforce: 'post',
      async transform(code, id) {
        const [filename] = id.split('?');
        if (!isZeroRuntimeProcessableFile(id, transformLibraries)) {
          return null;
        }
        try {
          const result = await transformAsync(code, {
            filename,
            babelrc: false,
            configFile: false,
            plugins: [['@mui/zero-runtime/exports/sx-plugin']],
          });
          return {
            code: result?.code ?? code,
            map: result?.map,
          };
        } catch (ex) {
          console.error(ex);
        }
      },
    };
  }

  const zeroPlugin = baseZeroVitePlugin({
    cssVariablesPrefix: theme.cssVarPrefix,
    themeArgs: {
      theme,
    },
    preprocessor,
    babelOptions: {
      ...babelOptions,
      plugins: [
        '@babel/plugin-syntax-typescript',
        ...(babelOptions.plugins ?? []),
      ],
    },
    ...rest,
  });

  return [injectMUITokensPlugin(), intermediateBabelPlugin(), zeroPlugin];
}
