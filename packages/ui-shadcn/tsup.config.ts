import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    '@dailyuse/ui-react',
    '@dailyuse/ui-core',
  ],
  sourcemap: true,
  // Include CSS
  injectStyle: false,
});
