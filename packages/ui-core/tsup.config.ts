import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'color-picker/index': 'src/color-picker/index.ts',
    'dialog/index': 'src/dialog/index.ts',
    'message/index': 'src/message/index.ts',
    'form/index': 'src/form/index.ts',
    'loading/index': 'src/loading/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  treeshake: true,
});
