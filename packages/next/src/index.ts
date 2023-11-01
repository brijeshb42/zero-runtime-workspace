import * as path from 'node:path';
import type { NextConfig } from 'next';
import { findPagesDir } from 'next/dist/lib/find-pages-dir';
import {
  webpack as zeroWebpackPlugin,
  PluginOptions as ZeroPluginConfig,
} from '@mui/zero-unplugin';

export type { ZeroPluginConfig };

const extractionFile = path.join(
  path.dirname(require.resolve('../package.json')),
  'zero-virtual.css',
);

export function withZeroPlugin(
  nextConfig: NextConfig,
  zeroConfig: ZeroPluginConfig,
) {
  const { babelOptions, ...rest } = zeroConfig;
  const webpack: Exclude<NextConfig['webpack'], undefined> = (
    config,
    context,
  ) => {
    const { dir, dev, isServer, config: resolvedNextConfig } = context;

    const findPagesDirResult = findPagesDir(
      dir,
      // @ts-expect-error next.js v12 accepts 2 arguments, while v13 only accepts 1
      resolvedNextConfig.experimental?.appDir ?? false,
    );

    let hasAppDir = false;

    if ('appDir' in resolvedNextConfig.experimental) {
      hasAppDir =
        !!resolvedNextConfig.experimental.appDir &&
        !!(findPagesDirResult && findPagesDirResult.appDir);
    } else {
      hasAppDir = !!(findPagesDirResult && findPagesDirResult.appDir);
    }

    config.module.rules.unshift({
      enforce: 'pre',
      test: (filename: string) => filename.endsWith('zero-virtual.css'),
      use: require.resolve('../loader'),
    });
    config.plugins.push(
      zeroWebpackPlugin({
        ...rest,
        meta: {
          type: 'next',
          dev,
          isServer,
          outputCss: dev || hasAppDir || !isServer,
          placeholderCssFile: extractionFile,
        },
        asyncResolve(what) {
          if (what === 'next/image') {
            return require.resolve('@mui/zero-unplugin/next-image');
          } else if (what.startsWith('next/font')) {
            return require.resolve('@mui/zero-unplugin/next-font');
          }
          return null;
        },
        babelOptions: {
          ...babelOptions,
          presets: [...(babelOptions?.presets ?? []), 'next/babel'],
        },
      }),
    );

    if (typeof nextConfig.webpack === 'function') {
      return nextConfig.webpack(config, context);
    }
    return config;
  };
  return {
    ...nextConfig,
    webpack,
  };
}
