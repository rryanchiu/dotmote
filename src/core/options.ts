import type {
  ContentItem,
  ContentInput,
  CoreOptions,
  DotmoteProps,
} from '../types.js';
import { resolveTheme } from '../themes.js';
import { normalizeItems } from './physics.js';
import { DEFAULT_BREAKPOINTS } from './createDotMatrixCore.js';

const DEFAULT_ITEMS_INPUT: ContentInput[] = ['A', 'B', 'C', 'D', 'E'];

const DEFAULT_FONT_FAMILY = '"Trebuchet MS", ui-rounded, sans-serif';
const DEFAULT_DOT = 'rgba(128, 128, 128, 0.5)';
const DEFAULT_GLOW: [string, string, string] = [
  'rgba(120, 120, 120, 0.9)',
  'rgba(170, 170, 170, 0.9)',
  'rgba(220, 220, 220, 0.9)',
];

/**
 * Turn `values` (each character is a body) or `items` into the concrete list of
 * drifting bodies. Used by the React and Vue wrappers alike.
 */
export function resolveItemBodies(props: DotmoteProps): ContentItem[] {
  if (props.values !== undefined) {
    const out: ContentItem[] = [];
    for (const ch of Array.from(props.values)) {
      if (ch.trim().length === 0) continue;
      out.push({ kind: 'text', value: ch });
    }
    return out;
  }
  return normalizeItems(props.items ?? DEFAULT_ITEMS_INPUT);
}

/**
 * Framework-agnostic: turn any Dotmote-props-shaped source (React or Vue) into
 * the resolved options the canvas core understands. `dark` is the OS color
 * scheme and is only used when `theme` resolves to `auto`.
 */
export function buildOptions(props: DotmoteProps, dark = false): CoreOptions {
  const theme = resolveTheme(props.theme, dark);
  const glow: [string, string, string] = theme.activeDotColor
    ? [theme.activeDotColor, theme.activeDotColor, theme.activeDotColor]
    : theme.glow ?? DEFAULT_GLOW;
  return {
    items: resolveItemBodies(props),
    dot: theme.dotColor ?? DEFAULT_DOT,
    glow,
    background: theme.background,
    dotRadius: props.dotRadius,
    glowStrength: props.glowStrength ?? props.glowAlpha ?? 1,
    speed: props.speed ?? 1,
    motion: props.motion ?? 'drift',
    fontFamily: props.fontFamily ?? DEFAULT_FONT_FAMILY,
    fontSize: props.fontSize,
    fontSizeOverride: props.fontSizeOverride,
    fontSizeMin: props.fontSizeMin ?? 207,
    fontSizeMax: props.fontSizeMax ?? 270,
    breakpoints: { ...DEFAULT_BREAKPOINTS, ...(props.breakpoints ?? {}) },
    spacingScale: props.spacingScale ?? 1,
    introDurationMs: props.introDurationMs ?? 520,
  };
}
