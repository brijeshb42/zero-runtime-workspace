const { withZeroPlugin } = require('@mui/zero-next-plugin');
const { createTheme } = require('@mui/material/styles');

const theme = createTheme();

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
};

/** @type {import('next').NextConfig} */
const nextConfig = {};

module.exports = withZeroPlugin(nextConfig, zeroPluginOptions);
