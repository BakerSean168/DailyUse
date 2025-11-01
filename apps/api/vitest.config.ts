/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@dailyuse/domain-server': path.resolve(__dirname, '../../packages/domain-server/src'),
      '@dailyuse/contracts': path.resolve(__dirname, '../../packages/contracts/src'),
      '@dailyuse/utils': path.resolve(__dirname, '../../packages/utils/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup-database.ts'], // ✅ 使用真实数据库
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}'],
    exclude: [
      'node_modules',
      'dist',
      '.git',
      '.cache',
      'src/test/setup.ts',
      'prisma/**/*', // 排除 Prisma 文件
    ],
    // Mock 配置
    alias: {
      '@nestjs/common': path.resolve(__dirname, './src/test/mocks/nestjs-common.ts'),
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/', 'prisma/', '**/*.d.ts', '**/*.config.*', 'dist/'],
    },
    // API 测试超时设置（包括数据库操作）
    testTimeout: 30000,
    // 序列化测试，避免数据库冲突
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // API 测试使用单进程避免数据库锁
      },
    },
    // 测试数据库配置 - 暂时禁用 globalSetup (shell 路径问题)
    // globalSetup: './src/test/globalSetup.ts',
  },
});
