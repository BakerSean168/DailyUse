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
      // 完全禁用 Vite 的压缩中间件，避免破坏 SSE 流
      compress: false,
      fs: {
        allow: ['..', '../../'],
      },
      // 添加代理配置,解决 EventSource 跨域问题
      proxy: {
        '/api': {
          target: 'http://localhost:3888',
          changeOrigin: true,
          secure: false,
          ws: true, // 支持 WebSocket
          // 禁用压缩，否则会破坏 SSE 流
          compress: false,
          // SSE 特定配置
          onProxyRes: (proxyRes: any, req: any, res: any) => {
            // 确保 SSE 流不被缓冲和压缩
            if (req.url?.includes('/sse/')) {
              // 删除可能存在的压缩相关头
              delete proxyRes.headers['content-encoding'];
              // 防止下游再次压缩
              proxyRes.headers['x-no-compression'] = 'true';
            }
          },
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('代理错误', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('发送请求到目标:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('接收响应:', proxyRes.statusCode, req.url);
              // SSE 请求特殊处理
              if (req.url?.includes('/sse/')) {
                console.log('SSE 响应头:', proxyRes.headers);
              }
            });
          },
        },
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
