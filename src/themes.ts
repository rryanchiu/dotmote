import type { ThemeConfig, ThemeLike } from './types';

/**
 * Built-in neutral, brand-agnostic theme presets.
 *
 * All three rgb stops and dot colors are intentionally generic so the backdrop
 * reads as "subtle dotted texture", not a particular brand. Swap them out via
 * the `theme` prop with an inline {@link ThemeConfig} if you need custom colors.
 */
export const themes: Record<'light' | 'dark' | 'mono' | 'gradient' | 'rainbow', ThemeConfig> = {
  /** Classic light theme: white background, soft gray dots, mid-gray glow. */
  light: {
    background: '#ffffff',
    dot: 'rgb(230, 228, 228)',
    glow: [
      'rgb(160, 159, 159)',
      'rgb(160, 159, 159)',
      'rgb(160, 159, 159)',
    ],
  },
  /** Soft light dots that sit on dark backdrops. */
  dark: {
    dot: 'rgba(255, 255, 255, 0.16)',
    glow: [
      'rgba(255, 255, 255, 0.14)',
      'rgba(255, 255, 255, 0.30)',
      'rgba(255, 255, 255, 0.56)',
    ],
  },
  /** The default — a neutral gray-readable lattice on any backdrop. */
  mono: {
    dot: 'rgba(128, 128, 128, 0.5)',
    glow: [
      'rgba(120, 120, 120, 0.9)',
      'rgba(170, 170, 170, 0.9)',
      'rgba(220, 220, 220, 0.9)',
    ],
  },
  /** A colorful (but still generic) gradient for demos. */
  gradient: {
    dot: 'rgba(128, 128, 128, 0.5)',
    glow: [
      'rgba(99, 102, 241, 0.9)',
      'rgba(139, 92, 246, 0.9)',
      'rgba(217, 70, 239, 0.9)',
    ],
  },
  /** Rainbow glow: a red → green → blue sweep for the illuminated dots. */
  rainbow: {
    dot: 'rgba(128, 128, 128, 0.5)',
    glow: [
      'rgba(255, 77, 77, 0.9)',
      'rgba(61, 220, 132, 0.9)',
      'rgba(77, 159, 255, 0.9)',
    ],
  },
};

const PRESET_KEYS = new Set(['light', 'dark', 'mono', 'gradient', 'rainbow']);

/**
 * Resolve a {@link ThemeLike} into a concrete {@link ThemeConfig}.
 *
 * @param theme A preset name or an inline config. Defaults to `'mono'` when
 *   `undefined`.
 */
export function resolveTheme(theme?: ThemeLike): ThemeConfig {
  if (theme === undefined || theme === null) return themes.mono;
  if (typeof theme === 'string') {
    if (PRESET_KEYS.has(theme)) return themes[theme as keyof typeof themes];
    // Unknown preset: fall back to the neutral default rather than crashing.
    return themes.mono;
  }
  // Inline config — clone so callers can't accidentally mutate our preset.
  const glow =
    Array.isArray(theme.glow) && theme.glow.length === 3
      ? theme.glow
      : themes.mono.glow;
  return {
    dot: theme.dot ?? themes.mono.dot,
    glow: [glow[0], glow[1], glow[2]],
    ...(theme.background ? { background: theme.background } : {}),
  };
}
