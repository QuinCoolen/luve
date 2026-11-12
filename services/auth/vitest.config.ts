import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts'],
    environment: 'node',
    // The e2e suite starts a Postgres container (Testcontainers).
    hookTimeout: 180_000,
    testTimeout: 30_000,
  },
});
