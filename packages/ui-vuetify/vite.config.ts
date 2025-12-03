import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ['src/**/*.ts', 'src/**/*.vue'],
      outDir: 'dist',
      entryRoot: 'src',
      tsconfigPath: './tsconfig.json',
      compilerOptions: {
        // 保留常量枚举
        preserveConstEnums: true,
        // 保留注释
        stripInternal: false,
      },
      // 打包成单个 index.d.ts
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'DailyUseUI',
      formats: ['es'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    outDir: 'dist',
    // CSS 独立输出
    cssCodeSplit: false,
    // 清空 dist
    emptyOutDir: true,
    // SourceMap
    sourcemap: true,
    // 优化选项
    minify: false,
    rollupOptions: {
      // 外部依赖
      external: ['vue', 'vuetify', '@mdi/font', /^vuetify\/.*/],
      output: {
        // 全局变量
        globals: {
          vue: 'Vue',
          vuetify: 'Vuetify',
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
