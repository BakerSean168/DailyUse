import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Vitest Benchmark Configuration (STORY-014)
 * 性能基准测试配置
 */
export default defineConfig({
  test: {
    benchmark: {
      include: ['**/*.bench.ts'],
      exclude: ['node_modules', 'dist'],
      reporters: ['verbose'],
      outputFile: './benchmarks/results/benchmark-results.json',
    },
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@dailyuse/domain-client': path.resolve(__dirname, '../../packages/domain-client/src'),
      '@dailyuse/contracts': path.resolve(__dirname, '../../packages/contracts/src'),
    },
  },
});
