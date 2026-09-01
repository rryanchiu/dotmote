export { Dotmote } from './Dotmote.js';
/** @deprecated Use {@link Dotmote}. Kept as a backwards-compatible alias. */
export { Dotmote as DotMatrixBackground } from './Dotmote.js';

export type {
  DotmoteProps,
  DotMatrixBackgroundProps,
  ContentItem,
  ContentInput,
  ThemeConfig,
  ThemePreset,
  ThemeLike,
  Breakpoints,
  MotionMode,
  Body,
  CoreOptions,
} from './types.js';

export { themes, resolveTheme } from './themes.js';

export {
  createDotMatrixCore,
  DEFAULT_BREAKPOINTS,
  DEFAULT_ITEMS,
  normalizeItems,
  bounce,
  resolveCollision,
  stepBodies,
  stepRoam,
  stepTicker,
  isTickerMotion,
  clamp,
  easeOutCubic,
} from './core/index.js';
export type { DotMatrixCoreHandle, DotMatrixCoreConfig } from './core/index.js';

/** Default export is the component itself. */
export { Dotmote as default } from './Dotmote.js';
