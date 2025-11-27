import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*.ts'],
      outDir: 'dist',
      // 生成多入口的类型声明
      rollupTypes: false,
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'images/index': resolve(__dirname, 'src/images/index.ts'),
        'audio/index': resolve(__dirname, 'src/audio/index.ts'),
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    outDir: 'dist',
    emptyOutDir: true,
    // 复制静态资源
    copyPublicDir: false,
    rollupOptions: {
      output: {
        // 保持资源文件结构
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  // 确保资源 URL 正确处理
  base: './',
});
