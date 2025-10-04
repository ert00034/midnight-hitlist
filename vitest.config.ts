import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globals: true,
    reporters: 'default',
    coverage: { enabled: false },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
    },
  },
});
