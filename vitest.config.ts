import { defineConfig } from 'vitest/config';

// Keep vitest rooted at the project root so it finds `tests/**`.
// (vite.config.ts sets `root: 'examples'` for the demo site, which would
// otherwise make vitest search under `examples/`.)
export default defineConfig({
  root: '.',
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
