/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import path from 'node:path';
import electron from 'vite-plugin-electron/simple';
import react from '@vitejs/plugin-react';

// 原生模块列表
const nativeModules = ['better-sqlite3', 'electron'];

// 本地工作区包（避免被 optimizeDeps 处理）
const workspacePkgs = [
  '@dailyuse/utils',
  '@dailyuse/domain-client',
  '@dailyuse/domain-server',
  '@dailyuse/contracts',
  '@dailyuse/infrastructure-server',
  '@dailyuse/ui-shadcn',
];

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@main': path.resolve(__dirname, './src/main'),
      '@preload': path.resolve(__dirname, './src/preload'),
      '@renderer': path.resolve(__dirname, './src/renderer'),
    },
  },
  base: './',
  build: {
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
      external: nativeModules,
    },
  },
  optimizeDeps: {
    exclude: [...nativeModules, ...workspacePkgs],
  },
  test: {
    globals: true,
    include: ['src/**/*.test.ts'],
    environment: 'jsdom',
  },
  plugins: [
    react(),
    electron({
      main: {
        entry: 'src/main/main.ts',
        vite: {
          resolve: {
            alias: {
              '@main': path.resolve(__dirname, './src/main'),
              '@preload': path.resolve(__dirname, './src/preload'),
              '@renderer': path.resolve(__dirname, './src/renderer'),
            },
          },
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: nativeModules,
              output: {
                format: 'es',
              },
            },
          },
          optimizeDeps: {
            exclude: [...nativeModules, ...workspacePkgs],
          },
        },
      },
      preload: {
        input: {
          preload: path.resolve(__dirname, 'src/preload/preload.ts'),
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: nativeModules,
              output: {
                inlineDynamicImports: false,
                manualChunks: undefined,
                entryFileNames: '[name].mjs',
              },
            },
          },
          optimizeDeps: {
            exclude: [...nativeModules, ...workspacePkgs],
          },
        },
      },
      renderer: process.env.NODE_ENV === 'test' ? undefined : {},
    }),
  ],
});
