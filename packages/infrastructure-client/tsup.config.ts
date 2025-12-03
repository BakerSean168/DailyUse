import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/ports/index.ts',
    'src/adapters/http/index.ts',
    'src/adapters/ipc/index.ts',
    'src/adapters/storage/index.ts',
  ],
  format: ['esm'],
  dts: true,
  clean: true,
  external: [
    '@dailyuse/contracts',
    '@dailyuse/domain-client',
    '@dailyuse/utils',
  ],
  sourcemap: true,
});
