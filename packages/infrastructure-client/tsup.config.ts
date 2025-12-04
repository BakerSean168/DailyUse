import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  external: ['@dailyuse/contracts', '@dailyuse/domain-client', '@dailyuse/utils'],
  sourcemap: true,
});
