import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './Playground';

// Entry module — kept separate from Playground.tsx so the demo component file
// stays a pure component (enables Vite Fast Refresh and avoids re-running
// createRoot() on HMR re-execution).
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
