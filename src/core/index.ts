export {
  createDotMatrixCore,
  DEFAULT_BREAKPOINTS,
  DEFAULT_ITEMS,
} from './createDotMatrixCore.js';
export type { DotMatrixCoreHandle, DotMatrixCoreConfig } from './createDotMatrixCore.js';

export {
  normalizeItems,
  bounce,
  resolveCollision,
  stepBodies,
  stepRoam,
  stepTicker,
  isTickerMotion,
  clamp,
  easeOutCubic,
} from './physics.js';
