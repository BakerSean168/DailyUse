/// <reference types="vitest" />
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const isDev = mode !== 'production';
  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@dailyuse/utils': path.resolve(__dirname, '../../packages/utils/src'),
        '@dailyuse/domain': path.resolve(__dirname, '../../packages/domain/src'),
        '@dailyuse/contracts': path.resolve(__dirname, '../../packages/contracts/src'),
        '@dailyuse/domain-client': path.resolve(__dirname, '../../packages/domain-client/src'),
        '@dailyuse/domain-server': path.resolve(__dirname, '../../packages/domain-server/src'),
        '@dailyuse/ui': path.resolve(__dirname, '../../packages/ui/src'),
        '@dailyuse/assets': path.resolve(__dirname, '../../packages/assets/src'),
        '@dailyuse/assets/images': path.resolve(__dirname, '../../packages/assets/src/images'),
        '@dailyuse/assets/audio': path.resolve(__dirname, '../../packages/assets/src/audio'),
      },
    },
    plugins: [
      vue({
        template: {
          transformAssetUrls: {
            base: null,
            includeAbsolute: false,
          },
        },
      }),
    ],
    server: {
      port: 5173,
      open: false,
      middlewareMode: false,
      fs: {
        allow: ['..', '../../'],
      },
    },
    preview: {
      port: 5173,
      open: false,
    },
    build: {
      sourcemap: isDev,
    },
    test: {
      globals: true,
      environment: 'happy-dom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/__tests__/**/*.test.ts', 'src/**/*.spec.ts'],
      exclude: ['node_modules', 'dist', '.git', '.cache'],
      css: {
        modules: {
          classNameStrategy: 'non-scoped',
        },
      },
      // Mock CSS and asset imports
      server: {
        deps: {
          inline: ['vuetify'],
        },
      },
    },
  };
});
