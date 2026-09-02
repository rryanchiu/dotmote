import type { ThemeConfig, ThemeLike } from './types.js';

/**
 * Built-in brand-agnostic theme presets.
 *
 * All rgb stops and dot colors are intentionally generic so the backdrop reads
 * as "subtle dotted texture", not a particular brand. Swap them out via the
 * `theme` prop with an inline {@link ThemeConfig} if you need custom colors.
 */
export const themes: Record<'light' | 'dark' | 'mono' | 'gradient', ThemeConfig> = {
  /** Classic light theme: white background, soft gray dots, mid-gray glow. */
  light: {
    background: '#ffffff',
    dotColor: 'rgb(230, 228, 228)',
    glow: [
      'rgb(160, 159, 159)',
      'rgb(160, 159, 159)',
      'rgb(160, 159, 159)',
    ],
  },
  /** Soft light dots that sit on dark backdrops. */
  dark: {
    dotColor: 'rgba(255, 255, 255, 0.16)',
    glow: [
      'rgba(255, 255, 255, 0.14)',
      'rgba(255, 255, 255, 0.30)',
      'rgba(255, 255, 255, 0.56)',
    ],
  },
  /** The default — a neutral gray-readable lattice on any backdrop. */
  mono: {
    dotColor: 'rgba(128, 128, 128, 0.5)',
    glow: [
      'rgba(120, 120, 120, 0.9)',
      'rgba(170, 170, 170, 0.9)',
      'rgba(220, 220, 220, 0.9)',
    ],
  },
  /** A colorful (but still generic) gradient for demos. */
  gradient: {
    dotColor: 'rgba(128, 128, 128, 0.5)',
    glow: [
      'rgba(56, 189, 248, 0.9)',
      'rgba(99, 102, 241, 0.9)',
      'rgba(236, 72, 153, 0.9)',
    ],
  },
};

const THEME_KEYS = new Set(['light', 'dark', 'mono', 'gradient']) as Set<
  keyof typeof themes
>;

/**
 * Resolve a {@link ThemeLike} into a concrete {@link ThemeConfig}.
 *
 * `auto` (or `undefined`) resolves to `light`/`dark` based on `dark`. Pass the
 * current OS `prefers-color-scheme` value here; it defaults to light so the
 * function stays SSR-safe (it never touches `window`/`matchMedia` itself).
 *
 * @param theme A preset name or an inline config. Defaults to `auto`.
 * @param dark  Whether the OS prefers a dark scheme (used only for `auto`).
 */
export function resolveTheme(theme?: ThemeLike, dark = false): ThemeConfig {
  if (theme === undefined || theme === null || theme === 'auto') {
    return themes[dark ? 'dark' : 'light'];
  }
  if (typeof theme === 'string') {
    if (THEME_KEYS.has(theme)) return themes[theme as keyof typeof themes];
    // Unknown preset name: fall back to the scheme-appropriate default.
    return themes[dark ? 'dark' : 'light'];
  }
  // Inline config — clone so callers can't accidentally mutate our preset.
  const glow =
    Array.isArray(theme.glow) && theme.glow.length === 3
      ? theme.glow
      : themes[dark ? 'dark' : 'light'].glow;
  return {
    dotColor: theme.dotColor ?? themes.mono.dotColor,
    glow: [glow[0], glow[1], glow[2]],
    ...(theme.activeDotColor ? { activeDotColor: theme.activeDotColor } : {}),
    ...(theme.background ? { background: theme.background } : {}),
  };
}
