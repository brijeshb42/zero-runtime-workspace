/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
/**
 * @type {import('html-webpack-plugin')}
 */
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { webpack: zeroPlugin } = require('@mui/zero-unplugin');
const {
  experimental_extendTheme: extendTheme,
} = require('@mui/material/styles');

const theme = extendTheme();

/**
 * @typedef {import('@mui/zero-webpack-plugin').ZeroWebpackPluginOptions} ZeroWebpackPluginOptions
 */

/**
 * @type {ZeroWebpackPluginOptions}
 */
const zeroPluginOptions = {
  theme,
  cssVariablesPrefix: 'app',
  transformLibraries: ['local-ui-lib'],
};

/**
 * @type {import('webpack').Configuration}
 */
module.exports = {
  entry: './src/index.tsx',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.mjs', '.mts', '.cjs', '.cts'],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  devServer: {
    static: './dist',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
      title: 'Webpack Test App',
      inject: 'body',
    }),
    zeroPlugin(zeroPluginOptions),
    new MiniCssExtractPlugin({
      filename: 'styles.css',
    }),
  ],
  optimization: {
    runtimeChunk: 'single',
    splitChunks: {
      chunks: 'all',
    },
  },
};
