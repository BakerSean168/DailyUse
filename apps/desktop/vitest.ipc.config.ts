import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    name: 'desktop-ipc',
    root: resolve(__dirname, 'src/main'),
    include: ['**/__tests__/**/*.spec.ts', '**/__tests__/**/*.test.ts'],
    environment: 'node',
    globals: true,
    setupFiles: ['./ipc/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['ipc/**/*.ts'],
      exclude: ['ipc/__tests__/**', 'ipc/index.ts'],
    },
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@dailyuse/infrastructure-server': resolve(__dirname, '../../packages/infrastructure-server/src'),
      '@dailyuse/domain-server': resolve(__dirname, '../../packages/domain-server/src'),
      '@dailyuse/application-server': resolve(__dirname, '../../packages/application-server/src'),
      '@dailyuse/contracts': resolve(__dirname, '../../packages/contracts/src'),
      '@dailyuse/utils': resolve(__dirname, '../../packages/utils/src'),
    },
  },
});
