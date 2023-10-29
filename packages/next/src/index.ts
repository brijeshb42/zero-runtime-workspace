import type { NextConfig } from 'next';
import {
  webpack as zeroWebpackPlugin,
  PluginOptions as ZeroPluginConfig,
} from '@mui/zero-unplugin';

export type { ZeroPluginConfig };

export function withZeroPlugin(
  nextConfig: NextConfig,
  zeroConfig: ZeroPluginConfig
) {
  const { babelOptions, ...rest } = zeroConfig;
  const webpack: Exclude<NextConfig['webpack'], undefined> = (
    config,
    context
  ) => {
    config.plugins.push(
      zeroWebpackPlugin({
        ...rest,
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
      })
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
