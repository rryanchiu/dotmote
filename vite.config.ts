import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// Dev + deploy config for the examples/playground demo.
// - `npm run dev`          → local playground at http://localhost:5199/
// - `npm run build:site`   → static demo site into `site/` (deployable)
// The library itself is built separately with `tsc` (see tsconfig.build.json).
export default defineConfig({
  root: 'examples',
  plugins: [react()],
  resolve: {
    alias: {
      // Allow the playground to import the library source directly.
      dotmote: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
    },
  },
  server: {
    port: 5199,
  },
  build: {
    // output to the project-root `site/` (relative to `root: 'examples'`).
    // Base is left as '/' by default; pass `--base=/dotmote/` for GitHub Pages.
    outDir: '../site',
  },
});
