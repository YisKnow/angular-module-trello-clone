import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// ponytail: no Angular plugin needed — testing plain services, not components
export default defineConfig({
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('./src/app/shared', import.meta.url)),
      '@auth': fileURLToPath(
        new URL('./src/app/features/auth', import.meta.url),
      ),
      '@boards': fileURLToPath(
        new URL('./src/app/features/boards', import.meta.url),
      ),
      '@layout': fileURLToPath(
        new URL('./src/app/core/layout', import.meta.url),
      ),
      '@environments': fileURLToPath(
        new URL('./src/environments', import.meta.url),
      ),
      '@core': fileURLToPath(new URL('./src/app/core', import.meta.url)),
      '@features': fileURLToPath(new URL('./src/app/features', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    setupFiles: ['src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'clover'],
      thresholds: {
        // Lines/stmts 80% protects total coverage; branches/funcs are
        // lower because board.component.ts (CDK drag-drop + dialog)
        // and button.component.ts (templateUrl) have limited test reach.
        lines: 80,
        statements: 78,
        functions: 78,
        branches: 65,
      },
    },
  },
});
