// import * as path from 'node:path';
import type { NextConfig } from 'next';
import {
  webpack as zeroWebpackPlugin,
  PluginOptions as ZeroPluginConfig,
} from '@mui/zero-unplugin';
// import { mkdirp } from 'mkdirp';

export type { ZeroPluginConfig };

// const CACHE_FILE = 'zero-plugin-cache.json';

// function getCacheDir(baseDir: string) {
//   return path.join(baseDir, '.next/cache');
// }

// async function createCacheDir(baseDir: string) {
//   const cacheDir = getCacheDir(baseDir);
//   const createdDir = await mkdirp(cacheDir);
//   if (typeof createdDir === 'undefined') {
//     return cacheDir;
//   }
//   return createdDir;
// }

export function withZeroPlugin(
  nextConfig: NextConfig,
  zeroConfig: ZeroPluginConfig
) {
  const { babelOptions, ...rest } = zeroConfig;
  const webpack: Exclude<NextConfig['webpack'], undefined> = (
    config,
    context
  ) => {
    const { dev, isServer } = context;

    config.plugins.push(
      zeroWebpackPlugin({
        ...rest,
        meta: {
          type: 'next',
          dev,
          isServer,
        },
        asyncResolve(what) {
          if (what === 'next/image') {
            return require.resolve('@mui/zero-unplugin/next-image');
          } else if (what.startsWith('next/font')) {
            return require.resolve('@mui/zero-unplugin/next-font');
          }
          return null;
        },
        // async writeCache(data) {
        //   if (!isServer) {
        //     return;
        //   }
        //   const cacheDir = await createCacheDir(dir);
        //   if (!cacheDir) {
        //     return;
        //   }
        //   await fs.writeFile(path.join(cacheDir, CACHE_FILE), data, 'utf-8');
        // },
        // restoreCache() {
        //   const dummyData = JSON.stringify({});
        //   return new Promise<string>(async (resolve) => {
        //     if (isServer) {
        //       return resolve(dummyData);
        //     }
        //     const cacheDir = await createCacheDir(dir);
        //     if (!cacheDir) {
        //       resolve(dummyData);
        //       return;
        //     }
        //     try {
        //       const cachedData = await fs.readFile(
        //         path.join(cacheDir, CACHE_FILE),
        //         'utf-8'
        //       );
        //       resolve(cachedData);
        //     } catch (ex) {
        //       console.error(ex);
        //       resolve(dummyData);
        //     }
        //   });
        // },
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
