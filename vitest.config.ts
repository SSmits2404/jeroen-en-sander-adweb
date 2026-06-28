import { defineConfig } from 'vitest/config';

// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'], // Zorg dat dit pad klopt
  },
});