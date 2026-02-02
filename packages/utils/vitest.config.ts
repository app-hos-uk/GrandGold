import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      '@grandgold/types': path.resolve(__dirname, '../types/src/index.ts'),
    },
  },
});
