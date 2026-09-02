import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

import type {
  ContentInput,
  ContentItem,
  CoreOptions,
  DotmoteProps,
} from './types.js';
import { resolveTheme } from './themes.js';
import { normalizeItems } from './core/physics.js';
import {
  createDotMatrixCore,
  DEFAULT_BREAKPOINTS,
  type DotMatrixCoreHandle,
} from './core/createDotMatrixCore.js';

const DEFAULT_ITEMS_INPUT: ContentInput[] = ['A', 'B', 'C', 'D', 'E'];

const DEFAULT_FONT_FAMILY = '"Trebuchet MS", ui-rounded, sans-serif';
const DEFAULT_DOT = 'rgba(128, 128, 128, 0.5)';
const DEFAULT_GLOW: [string, string, string] = [
  'rgba(120, 120, 120, 0.9)',
  'rgba(170, 170, 170, 0.9)',
  'rgba(220, 220, 220, 0.9)',
];

function resolveItemBodies(props: DotmoteProps): ContentItem[] {
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

function buildOptions(props: DotmoteProps, dark = false): CoreOptions {
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

const containerBase: CSSProperties = {
  position: 'absolute',
  inset: 0,
  overflow: 'hidden',
  pointerEvents: 'none',
};

const canvasStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'block',
};

/**
 * A brand-agnostic dotted-matrix glow background.
 *
 * Renders a full-size lattice of dots with a few drifting "bodies"
 * (letters / emoji / shapes) revealed *through* the dots as glowing,
 * dot-assembled light blobs. The colors and content are fully configurable and
 * default to neutral, brand-free values.
 *
 * SSR-safe: the component renders an empty `<canvas>` during server / static
 * rendering; every `window` / `document` / `ResizeObserver` / DPR touch happens
 * inside a `useEffect` after mount.
 */
export function Dotmote(props: DotmoteProps): JSX.Element {
  const {
    className,
    class: cls,
    style,
    ariaHidden = true,
  } = props;
  // `class` is an HTML-style alias for `className` (React uses `className`).
  const wrapperClass = className ?? cls;

  // OS color scheme, used only when `theme` resolves to `auto`. Defaults to
  // light so server / static rendering stays SSR-safe (no `window`/`matchMedia`
  // at render time); it syncs to the real value after mount.
  const [dark, setDark] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setDark(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const coreRef = useRef<DotMatrixCoreHandle | null>(null);

  // Deliberately enumerate the primitive props (rather than the whole `props`
  // object) so inline `theme` / `breakpoints` literals don't rebuild options
  // every render. buildOptions reads only the fields listed below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const options = useMemo(() => buildOptions(props, dark), [
    props.values,
    props.items,
    props.theme,
    props.dotRadius,
    props.glowStrength,
    props.glowAlpha,
    props.speed,
    props.motion,
    props.fontFamily,
    props.fontSize,
    props.fontSizeOverride,
    props.fontSizeMin,
    props.fontSizeMax,
    props.breakpoints,
    props.spacingScale,
    props.introDurationMs,
    dark,
  ]);

  // Keep the latest options available to the mount effect without re-running it.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Create / destroy the core exactly once per mounted instance.
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const core = createDotMatrixCore(canvas, container, optionsRef.current);
    coreRef.current = core;
    core.start();
    return () => {
      coreRef.current = null;
      core.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hot-update on option change (theme colors, content, layout, ...).
  useEffect(() => {
    coreRef.current?.configure(optionsRef.current);
  }, [options]);

  return (
    <div
      ref={containerRef}
      className={wrapperClass}
      style={{ ...containerBase, ...style }}
      aria-hidden={ariaHidden}
    >
      <canvas ref={canvasRef} style={canvasStyle} />
    </div>
  );
}

export default Dotmote;
