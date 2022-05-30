/// <reference types='vitest/globals' />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    threads: true,
    coverage: {
      enabled: true,
      include: ['src/**'],
      lines: 99,
      functions: 99,
      branches: 99,
      statements: 99,
      reporter: ['html', 'lcovonly', 'text-summary'],
    },
    environment: 'jsdom',
    globals: true,
    snapshotFormat: {
      escapeString: false,
      printBasicPrototype: false,
    },
  },
});
