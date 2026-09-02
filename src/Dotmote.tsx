import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

import type { DotmoteProps } from './types.js';
import { buildOptions } from './core/options.js';
import {
  createDotMatrixCore,
  type DotMatrixCoreHandle,
} from './core/createDotMatrixCore.js';

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
    props.charGap,
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
