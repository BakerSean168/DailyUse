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
      // 浏览器环境 Node.js polyfills
      'crypto': 'crypto-browserify',
      'stream': 'stream-browserify',
      'buffer': 'buffer',
    },
  },
  define: {
    // 为 crypto-browserify 提供全局 Buffer
    'global': 'globalThis',
  },
  base: './',
  build: {
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
      external: nativeModules,
      output: {
        // Code splitting for vendor libraries
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // UI components
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-scroll-area',
            'class-variance-authority',
            'clsx',
            'tailwind-merge',
          ],
          // Utilities
          'vendor-utils': ['date-fns', 'zod', 'uuid'],
          // Virtual scrolling (lazy loaded)
          'vendor-virtual': ['@tanstack/react-virtual'],
        },
      },
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
        entry: path.resolve(__dirname, 'src/main/main.ts'),
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
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
                assetFileNames: '[name].[ext]',
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
                format: 'cjs',
                inlineDynamicImports: false,
                manualChunks: undefined,
                entryFileNames: '[name].cjs',
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
