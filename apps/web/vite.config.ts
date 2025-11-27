/// <reference types="vitest" />
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
  const isDev = mode !== 'production';
  return {
    resolve: {
      alias: {
        // 仅项目内部别名
        '@': path.resolve(__dirname, './src'),
        // 注意：所有 @dailyuse/* 包通过 node_modules 解析到各包的 dist 目录
        // 不再使用指向源码的别名，这样可以：
        // 1. 保持包边界清晰
        // 2. 让 TypeScript 和 Vite 使用相同的解析策略
        // 3. 确保类型声明正确生成
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
      // 打包分析插件（仅生产模式）
      !isDev &&
        visualizer({
          filename: './dist/stats.html', // 输出文件
          open: true, // 构建后自动打开浏览器
          gzipSize: true, // 显示 gzip 大小
          brotliSize: true, // 显示 brotli 大小
          template: 'treemap', // 使用树状图模式（可选：sunburst, treemap, network）
        }),
    ].filter(Boolean),
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
