/// <reference types='vitest/globals' />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'istanbul',
      enabled: true,
      include: ['src/**'],
      thresholds: {
        lines: 99,
        functions: 99,
        branches: 99,
        statements: 99,
      },
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
