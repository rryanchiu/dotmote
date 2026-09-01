import type * as React from 'react';

/**
 * A single drifting "body" that will be revealed through the dot-matrix mask.
 */
export type ContentItem =
  | { kind: 'text'; value: string }
  | { kind: 'emoji'; value: string }
  | {
      kind: 'shape';
      value: 'circle' | 'square' | 'triangle' | 'star' | 'diamond';
      radius?: number;
    }
  | { kind: 'path'; value: string };

/**
 * Loose input accepted for `items`. Strings are normalized to `{ kind: 'text' }`.
 */
export type ContentInput = ContentItem | string;

/**
 * Animation behavior for the drifting bodies.
 * - `drift` — random drift + wall bounce + pairwise collision (default).
 * - `roam`  — random drift + wall bounce, but bodies pass through each other.
 * - `static` — frozen (after the intro fade-in).
 * - `ticker-left` / `ticker-right` — a marquee / billboard: the bodies scroll
 *   in a single row at the vertical center, looping left→right or right→left.
 */
export type MotionMode =
  | 'static'
  | 'drift'
  | 'roam'
  | 'ticker-left'
  | 'ticker-right';

/**
 * A resolved theme: the colors that drive the dot grid and the glow gradient.
 * `dot` and `background` are optional so a preset can keep them neutral.
 */
export interface ThemeConfig {
  /** Dot color of the background lattice (CSS color string). */
  dot?: string;
  /** Three-stop linear gradient for the illuminated glow: [start, mid, end]. */
  glow: [string, string, string];
  /** Optional background color applied to the element (behind the dots). */
  background?: string;
}

/** Built-in neutral, brand-agnostic theme names. */
export type ThemePreset = 'light' | 'dark' | 'mono' | 'gradient' | 'rainbow';

/** A theme may be a preset name or an inline config. */
export type ThemeLike = ThemePreset | ThemeConfig;

/** Responsive breakpoint geometry. */
export interface Breakpoints {
  small: number;
  medium: number;
  smallSpacing: number;
  mediumSpacing: number;
  largeSpacing: number;
}

export interface DotmoteProps {
  /** Bodies to drift. Defaults to the neutral letters `['A','B','C','D','E']`. */
  items?: ContentInput[];
  /** Theme preset or custom config. Defaults to `'mono'`. */
  theme?: ThemeLike;
  /** Dot color of the background lattice. Overrides the theme's `dot`. */
  dotColor?: string;
  /**
   * Color of the *illuminated* (lit) dots — the glow. When set it's used as a
   * solid color for all three gradient stops (a flat-color light blob). When
   * omitted, the theme's gradient glow is used. Hex strings (no alpha) are the
   * easiest to pick visually.
   */
  activeDotColor?: string;
  /** Dot radius in px. Defaults to `spacing <= 9 ? 0.82 : 1`. */
  dotRadius?: number;
  /**
   * Glow *strength* (not opacity). Defaults to `1`. `<1` fades the glow;
   * `>1` (up to ~3) layers it brighter via additive compositing.
   */
  glowStrength?: number;
  /**
   * @deprecated Renamed to {@link glowStrength}. Kept as a backwards-compatible
   * alias; when both are set, `glowStrength` wins.
   */
  glowAlpha?: number;
  /** Global speed multiplier. Defaults to `1`. */
  speed?: number;
  /** Animation behavior for the bodies. Defaults to `'drift'`. */
  motion?: MotionMode;
  /**
   * Font stack for text/emoji bodies. Defaults to a neutral stack.
   * Note: the weight and size are prefixed automatically (`900 ${fontSize}px ...`).
   */
  fontFamily?: string;
  /**
   * Override the automatic font size for the largest breakpoint.
   * A number sets it directly; a function receives the container width in px.
   */
  fontSizeOverride?: number | ((width: number) => number);
  /** Minimum of the automatic large-screen font-size clamp. Defaults to `207`. */
  fontSizeMin?: number;
  /** Maximum of the automatic large-screen font-size clamp. Defaults to `270`. */
  fontSizeMax?: number;
  /** Responsive breakpoints. See {@link Breakpoints} for defaults. */
  breakpoints?: Partial<Breakpoints>;
  /**
   * Scale the lattice density on top of the responsive breakpoints.
   * `1` (default) keeps the breakpoint spacing; `<1` makes the dots denser,
   * `>1` sparser. This also scales the edge padding and the default dot size.
   */
  spacingScale?: number;
  /** Intro hold duration in ms during which bodies are frozen and fade in. Defaults to `520`. */
  introDurationMs?: number;
  /** Passed through to the container `<div>`. */
  className?: string;
  /** Passed through to the container `<div>`. */
  style?: React.CSSProperties;
  /** Hide the element from assistive tech. Defaults to `true`. */
  ariaHidden?: boolean;
}

/**
 * @deprecated Renamed to {@link DotmoteProps}. Kept as a backwards-compatible
 * alias.
 */
export type DotMatrixBackgroundProps = DotmoteProps;

/** Internal resolved options passed to the canvas core. */
export interface CoreOptions {
  items: ContentItem[];
  dot: string;
  glow: [string, string, string];
  background?: string;
  dotRadius?: number;
  glowStrength: number;
  speed: number;
  motion: MotionMode;
  fontFamily: string;
  fontSizeOverride?: number | ((width: number) => number);
  fontSizeMin: number;
  fontSizeMax: number;
  breakpoints: Breakpoints;
  spacingScale: number;
  introDurationMs: number;
}

/** A static container to keep physics pure and testable. */
export interface Body {
  id: number;
  item: ContentItem;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  fontSize: number;
  velocityX: number;
  velocityY: number;
  colors: [string, string, string];
  /** Performance-ish timestamp (ms) at which this body's intro started. */
  introStart: number;
}
