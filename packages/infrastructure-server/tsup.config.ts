import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/ports/index.ts',
    'src/adapters/prisma/index.ts',
    'src/adapters/memory/index.ts',
  ],
  format: ['esm'],
  dts: true,
  clean: true,
  external: [
    '@dailyuse/contracts',
    '@dailyuse/domain-server',
    '@dailyuse/utils',
    '@prisma/client',
  ],
  sourcemap: true,
});
