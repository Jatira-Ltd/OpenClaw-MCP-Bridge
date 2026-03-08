import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts', 'src/__tests__/**/*.test.tsx'],
    testTimeout: 60000,
    hookTimeout: 60000,
  },
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    reportsDirectory: 'coverage',
    include: [
      'src/lib/**/*.ts',
      'src/commands/**/*.ts',
      'src/index.ts',
    ],
    exclude: [
      'src/__tests__/**',
      'src/**/*.d.ts',
      'src/types/**',
    ],
    thresholds: {
      lines: 50,
      functions: 50,
      branches: 40,
      statements: 50,
    },
  },
});
