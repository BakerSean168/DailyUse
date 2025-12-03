var __spreadArray =
  (this && this.__spreadArray) ||
  function (to, from, pack) {
    if (pack || arguments.length === 2)
      for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
        }
      }
    return to.concat(ar || Array.prototype.slice.call(from));
  };
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import path from 'node:path';
import electron from 'vite-plugin-electron/simple';
import vue from '@vitejs/plugin-vue';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';
// 原生模块列表
var nativeModules = ['better-sqlite3', 'bcrypt', 'electron'];
// 本地工作区包（避免被 optimizeDeps 处理）
var workspacePkgs = [
  '@dailyuse/utils',
  '@dailyuse/domain-client',
  '@dailyuse/domain-server',
  '@dailyuse/contracts',
  '@dailyuse/ui-vuetify',
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
    exclude: __spreadArray(__spreadArray([], nativeModules, true), workspacePkgs, true),
  },
  test: {
    globals: true,
    include: ['src/**/*.test.ts'],
    environment: 'jsdom',
  },
  plugins: [
    monacoEditorPlugin.default({
      languageWorkers: ['editorWorkerService', 'json'],
    }),
    vue(),
    electron({
      main: {
        entry: 'src/main/main-simple.ts',
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
            exclude: __spreadArray(__spreadArray([], nativeModules, true), workspacePkgs, true),
          },
        },
      },
      preload: {
        input: {
          main_preload: path.resolve(__dirname, 'src/preload/main.ts'),
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
            exclude: __spreadArray(__spreadArray([], nativeModules, true), workspacePkgs, true),
          },
        },
      },
      renderer: process.env.NODE_ENV === 'test' ? undefined : {},
    }),
  ],
});
