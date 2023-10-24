import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  splitting: true,
  sourcemap: true,
  clean: true,
  format: ['cjs', 'esm'],
  treeshake: true,
  cjsInterop: true,
  dts: true,
  silent: true,
});
