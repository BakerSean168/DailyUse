import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/goal/index.ts',
    'src/task/index.ts',
    'src/schedule/index.ts',
    'src/reminder/index.ts',
    'src/account/index.ts',
    'src/sync/index.ts',
  ],
  format: ['esm'],
  dts: true,
  clean: true,
  external: [
    '@dailyuse/contracts',
    '@dailyuse/domain-client',
    '@dailyuse/infrastructure-client',
    '@dailyuse/utils',
  ],
  sourcemap: true,
});
