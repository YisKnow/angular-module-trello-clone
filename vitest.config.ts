import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// ponytail: no Angular plugin needed — testing plain services, not components
export default defineConfig({
  resolve: {
    alias: {
      '@models': fileURLToPath(new URL('./src/app/models', import.meta.url)),
      '@shared': fileURLToPath(
        new URL('./src/app/modules/shared', import.meta.url),
      ),
      '@auth': fileURLToPath(
        new URL('./src/app/modules/auth', import.meta.url),
      ),
      '@boards': fileURLToPath(
        new URL('./src/app/modules/boards', import.meta.url),
      ),
      '@layout': fileURLToPath(
        new URL('./src/app/modules/layout', import.meta.url),
      ),
      '@modules': fileURLToPath(
        new URL('./src/app/modules', import.meta.url),
      ),
      '@environments': fileURLToPath(
        new URL('./src/environments', import.meta.url),
      ),
      '@guards': fileURLToPath(new URL('./src/app/guards', import.meta.url)),
      '@interceptors': fileURLToPath(
        new URL('./src/app/interceptors', import.meta.url),
      ),
      '@services': fileURLToPath(
        new URL('./src/app/services', import.meta.url),
      ),
      '@utils': fileURLToPath(new URL('./src/app/utils', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    setupFiles: ['src/test-setup.ts'],
  },
});
