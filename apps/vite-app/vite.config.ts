import { defineConfig, splitVendorChunkPlugin } from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import { zeroVitePlugin } from '@mui/zero-vite-plugin';
import { createTheme } from '@mui/material/styles';

const theme = createTheme();
// @TODO - Make this part of the main package
// @ts-ignore
theme.applyDarkStyles = function applyDarkStyles(obj) {
  return {
    ':where([data-mui-color-scheme="dark"]) &': obj,
  };
};

export default defineConfig({
  plugins: [
    zeroVitePlugin({
      cssVariablesPrefix: 'app',
      theme,
      transformLibraries: ['local-library'],
    }),
    reactPlugin(),
    splitVendorChunkPlugin(),
  ],
});
