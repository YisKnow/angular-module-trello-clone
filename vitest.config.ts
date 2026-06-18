import { defineConfig } from 'vitest/config';

// ponytail: no Angular plugin needed — testing plain services, not components
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
  },
});
