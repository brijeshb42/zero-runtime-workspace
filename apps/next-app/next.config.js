/* eslint-disable */
/* eslint-env node */
const { withZeroPlugin } = require('@mui/zero-next-plugin');
const {
  experimental_extendTheme: extendTheme,
} = require('@mui/material/styles');

const theme = extendTheme();

/**
 * @typedef {import('@mui/zero-next-plugin').ZeroPluginConfig} ZeroPluginConfig
 */

/**
 * @type {ZeroPluginConfig}
 */
const zeroPluginOptions = {
  theme,
  cssVariablesPrefix: 'app',
  transformLibraries: ['local-ui-lib'],
  sourceMap: true,
  displayName: true,
};

/** @type {import('next').NextConfig} */
const nextConfig = {};

module.exports = withZeroPlugin(nextConfig, zeroPluginOptions);
