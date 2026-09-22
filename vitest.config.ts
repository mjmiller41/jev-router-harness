import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/router/**/*.ts',
        'src/memory/**/*.ts',
        'src/telemetry/**/*.ts',
        'src/agent/**/*.ts',
        'src/cli/flags.ts',
      ],
      exclude: ['src/cli/index.ts', 'src/types/**', 'src/tui/**'],
      thresholds: {
        lines: 85,
        functions: 80,
        branches: 70,
        statements: 85,
      },
    },
  },
});
