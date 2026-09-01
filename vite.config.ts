import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev-only server for the examples/playground. The library itself is built
// with `tsc` (see tsconfig.build.json) and needs no bundler.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5199,
  },
});
