import type { Body, ContentItem, CoreOptions, MotionMode } from '../types.js';
import {
  clamp,
  easeOutCubic,
  isTickerMotion,
  stepBodies,
  stepRoam,
  stepTicker,
} from './physics.js';

/** Responsive defaults, mirrored from the React component's props. */
export const DEFAULT_BREAKPOINTS = {
  small: 372,
  medium: 640,
  smallSpacing: 8,
  mediumSpacing: 9,
  largeSpacing: 12,
} as const;

/** Default content: five neutral letters. */
export const DEFAULT_ITEMS: ContentItem[] = [
  { kind: 'text', value: 'A' },
  { kind: 'text', value: 'B' },
  { kind: 'text', value: 'C' },
  { kind: 'text', value: 'D' },
  { kind: 'text', value: 'E' },
];

/** Default (neutral) initial velocities / angles for the first five bodies. */
const DEFAULT_ANGLES = [-2.46, -0.72, 2.36, 0.58, -2.78];

/** Self-sufficient defaults so the core works even without a React wrapper. */
const DEFAULT_CORE_OPTIONS: CoreOptions = {
  items: DEFAULT_ITEMS,
  dot: 'rgba(128, 128, 128, 0.5)',
  glow: ['rgba(120, 120, 120, 0.9)', 'rgba(170, 170, 170, 0.9)', 'rgba(220, 220, 220, 0.9)'],
  background: undefined,
  dotRadius: undefined,
  glowStrength: 1,
  speed: 1,
  motion: 'drift' as MotionMode,
  fontFamily: '"Trebuchet MS", ui-rounded, sans-serif',
  fontSizeOverride: undefined,
  fontSizeMin: 207,
  fontSizeMax: 270,
  breakpoints: { ...DEFAULT_BREAKPOINTS },
  spacingScale: 1,
  introDurationMs: 520,
};

export interface DotMatrixCoreConfig {
  /** Create an offscreen canvas. Defaults to `document.createElement('canvas')`. */
  canvasFactory?: () => HTMLCanvasElement;
  /** Watch the container with `ResizeObserver`. Default `true`. */
  observeResize?: boolean;
}

export interface DotMatrixCoreHandle {
  /** Merge new resolved options. Re-renders static layers; rebuilds bodies only on items/geometry change. */
  configure(options: CoreOptions): void;
  /** Measure the container (unless width/height are passed) and re-render static layers. */
  resize(cssWidth?: number, cssHeight?: number): void;
  start(): void;
  stop(): void;
  destroy(): void;
}

function fontString(fontSize: number, family: string): string {
  return `900 ${fontSize}px ${family}`;
}

/** Acquire a 2D context or throw — returns a non-nullable type so closures stay sound. */
function requireCtx(
  ctx: CanvasRenderingContext2D | null,
  label: string,
): CanvasRenderingContext2D {
  if (!ctx) {
    throw new Error(`Dotmote: unable to acquire a 2D canvas context (${label}).`);
  }
  return ctx;
}

function resolveSpacing(options: CoreOptions, width: number): number {
  const b = options.breakpoints;
  if (width < b.small) return b.smallSpacing;
  if (width < b.medium) return b.mediumSpacing;
  return b.largeSpacing;
}

function resolveFontSize(options: CoreOptions, width: number): number {
  const { fontSize, fontSizeOverride, fontSizeMin, fontSizeMax, breakpoints } = options;
  if (fontSize != null) return fontSize;
  if (fontSizeOverride != null) {
    return typeof fontSizeOverride === 'function'
      ? fontSizeOverride(width)
      : fontSizeOverride;
  }
  if (width < breakpoints.small) return 135;
  if (width < breakpoints.medium) return 162;
  return clamp(width * 0.195, fontSizeMin, fontSizeMax);
}

function getInitialAngle(index: number): number {
  if (index < DEFAULT_ANGLES.length) return DEFAULT_ANGLES[index];
  // Deterministic golden-angle spread for any additional bodies.
  return (index * 2.39996) % (Math.PI * 2);
}

function measureItemSize(
  ctx: CanvasRenderingContext2D,
  item: ContentItem,
  fontSize: number,
  family: string,
): { width: number; height: number } {
  switch (item.kind) {
    case 'text': {
      ctx.font = fontString(fontSize, family);
      const w = ctx.measureText(item.value).width;
      return { width: w, height: fontSize * 1.3 };
    }
    case 'emoji':
      return { width: fontSize * 1.25, height: fontSize * 1.25 };
    case 'shape': {
      const r = item.radius ?? fontSize * 0.45;
      return { width: r * 2, height: r * 2 };
    }
    case 'path':
      return { width: fontSize, height: fontSize };
  }
}

function drawShape(
  ctx: CanvasRenderingContext2D,
  value: 'circle' | 'square' | 'triangle' | 'star' | 'diamond',
  b: Body,
  fontSize: number,
): void {
  const r = (b.item as { radius?: number }).radius ?? fontSize * 0.45;
  const cx = b.centerX;
  const cy = b.centerY;
  ctx.beginPath();
  switch (value) {
    case 'circle':
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      break;
    case 'square':
      ctx.rect(cx - r, cy - r, r * 2, r * 2);
      break;
    case 'triangle':
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx - r, cy + r);
      ctx.lineTo(cx + r, cy + r);
      ctx.closePath();
      break;
    case 'diamond':
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy);
      ctx.lineTo(cx, cy + r);
      ctx.lineTo(cx - r, cy);
      ctx.closePath();
      break;
    case 'star': {
      const inner = r * 0.5;
      for (let i = 0; i < 10; i++) {
        const rr = i % 2 === 0 ? r : inner;
        const a = (Math.PI / 5) * i - Math.PI / 2;
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      break;
    }
  }
  ctx.fill();
}

/**
 * Framework-agnostic canvas core for the dot-matrix glow background.
 *
 * Owns four canvases (three offscreen) and the full render/physic/lifecycle
 * loop. The React component (and any vanilla / miniapp adapter) is a thin
 * wrapper over this. All browser globals (`window`, `document`,
 * `ResizeObserver`, `requestAnimationFrame`) are only touched once a handle is
 * created at runtime — never at module scope — so import-time SSR is safe.
 */
export function createDotMatrixCore(
  canvas: HTMLCanvasElement,
  container?: HTMLElement | null,
  initialOptions?: CoreOptions,
  config: DotMatrixCoreConfig = {},
): DotMatrixCoreHandle {
  const canvasFactory =
    config.canvasFactory ?? (() => document.createElement('canvas'));
  const observeResize = config.observeResize ?? true;

  const mainCtx = requireCtx(canvas.getContext('2d'), 'main');
  const bgCanvas = canvasFactory();
  const bgCtx = requireCtx(bgCanvas.getContext('2d'), 'bg');
  const maskCanvas = canvasFactory();
  const maskCtx = requireCtx(maskCanvas.getContext('2d'), 'mask');
  const lightCanvas = canvasFactory();
  const lightCtx = requireCtx(lightCanvas.getContext('2d'), 'light');

  let options: CoreOptions = {
    ...DEFAULT_CORE_OPTIONS,
    ...initialOptions,
    breakpoints: {
      ...DEFAULT_BREAKPOINTS,
      ...(initialOptions?.breakpoints ?? {}),
    },
  };

  let cssWidth = 0;
  let cssHeight = 0;
  let dpr = 1;
  let spacing = 12;
  let fontSize = 207;
  let dotRadius = 1;
  let edgePadding = spacing * 1.25;
  let tickerGapPx = 20;

  let bodies: Body[] = [];
  let pendingItems: ContentItem[] | null = null;
  let sizeKnown = false;

  let running = false;
  let rafId = 0;
  let lastTime: number | null = null;
  let ro: ResizeObserver | null = null;

  function computeDpr(): number {
    if (typeof window === 'undefined') return 1;
    return Math.min(window.devicePixelRatio || 1, 1.75);
  }

  function computeGeometry(): void {
    dpr = computeDpr();
    const scale = options.spacingScale ?? 1;
    spacing = Math.max(1, resolveSpacing(options, cssWidth) * scale);
    fontSize = resolveFontSize(options, cssWidth);
    dotRadius = options.dotRadius ?? (spacing <= 9 ? 0.82 : 1);
    edgePadding = spacing * 1.25;
    tickerGapPx = Math.max(16, fontSize * 0.5);
  }

  function applyTransform(ctx: CanvasRenderingContext2D): void {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function setCanvasSize(c: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
    c.width = Math.max(1, Math.round(cssWidth * dpr));
    c.height = Math.max(1, Math.round(cssHeight * dpr));
    applyTransform(ctx);
  }

  function drawDotGrid(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    sp: number,
    radius: number,
    fillStyle: string,
  ): void {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = fillStyle;
    const countX = Math.max(1, Math.round(width / sp));
    const countY = Math.max(1, Math.round(height / sp));
    const startX = (width - (countX - 1) * sp) / 2;
    const startY = (height - (countY - 1) * sp) / 2;
    for (let iy = 0; iy < countY; iy++) {
      const y = startY + iy * sp;
      for (let ix = 0; ix < countX; ix++) {
        const x = startX + ix * sp;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function redrawStatic(): void {
    if (!sizeKnown) return;
    drawDotGrid(bgCtx, cssWidth, cssHeight, spacing, dotRadius, options.dot);
    drawDotGrid(maskCtx, cssWidth, cssHeight, spacing, dotRadius, '#ffffff');
  }

  function applyBackground(): void {
    if (typeof options.background === 'string') {
      canvas.style.backgroundColor = options.background;
    } else {
      canvas.style.backgroundColor = 'transparent';
    }
  }

  function clampCenter(value: number): number {
    const lo = edgePadding;
    const hi = cssWidth - edgePadding;
    // Tiny containers can make the usable band collapse; fall back to center.
    if (hi <= lo) return cssWidth / 2;
    return clamp(value, lo, hi);
  }

  function createBodies(
    items: ContentItem[],
    w: number,
    h: number,
    opts: CoreOptions,
    startMs: number,
  ): Body[] {
    const pad = edgePadding;
    const usableW = Math.max(0, w - 2 * pad);
    const usableH = Math.max(0, h - 2 * pad);
    const ticker = isTickerMotion(opts.motion);
    const row = ticker || opts.motion === 'static';
    const dir = opts.motion === 'ticker-left' ? 1 : -1;
    const base = w < opts.breakpoints.medium ? 90 : 112;
    const gap = tickerGapPx;

    // Measure every item up front so a row/ticker can be laid out centered.
    const metas = items.map((item, i) => {
      const fsRaw = resolveFontSize(opts, w);
      // In a row/ticker, cap the glyph size to ~90% of the available height so
      // the text stays visible (not clipped) when the container is short.
      const fs = row ? Math.min(fsRaw, h * 0.9) : fsRaw;
      const size = measureItemSize(lightCtx, item, fs, opts.fontFamily);
      return { item, i, fs, size };
    });

    let rowWidth = 0;
    for (const m of metas) rowWidth += m.size.width;
    rowWidth += gap * (metas.length - 1);
    let cursor = (w - rowWidth) / 2; // left edge of the first body

    const list: Body[] = [];
    for (const m of metas) {
      const s = m.size;
      let cx: number;
      let cy: number;
      let vx: number;
      let vy: number;

      if (row) {
        // One horizontally-aligned row at the vertical center; static is frozen.
        cy = h / 2;
        cx = cursor + s.width / 2;
        cursor += s.width + gap;
        const speed = base * opts.speed;
        vx = ticker ? dir * speed : 0;
        vy = 0;
      } else {
        const angle = getInitialAngle(m.i);
        const speed = (base + m.i * 4) * opts.speed;
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed;
        cx = pad + (usableW > 0 ? Math.random() * usableW : 0);
        cy = pad + (usableH > 0 ? Math.random() * usableH : 0);
      }

      list.push({
        id: m.i,
        item: m.item,
        centerX: cx,
        centerY: cy,
        width: s.width,
        height: s.height,
        fontSize: m.fs,
        velocityX: vx,
        velocityY: vy,
        colors: [opts.glow[0], opts.glow[1], opts.glow[2]],
        introStart: startMs,
      });
    }
    return list;
  }

  function rebuildBodies(): void {
    if (!sizeKnown || cssWidth <= 0) return;
    const startMs = typeof performance !== 'undefined' ? performance.now() : 0;
    bodies = createBodies(
      pendingItems ?? options.items,
      cssWidth,
      cssHeight,
      options,
      startMs,
    );
    pendingItems = null;
  }

  function refreshBodySizes(): void {
    if (!bodies.length) return;
    for (const b of bodies) {
      const size = measureItemSize(lightCtx, b.item, fontSize, options.fontFamily);
      b.width = size.width;
      b.height = size.height;
      b.fontSize = fontSize;
      b.centerX = clampCenter(b.centerX);
      b.centerY = clampCenter(b.centerY);
    }
  }

  function paintBodyShape(b: Body): void {
    const { item, fontSize: fs } = b;
    const x0 = b.centerX - b.width / 2;
    const y0 = b.centerY - b.height / 2;
    const x1 = b.centerX + b.width / 2;
    const y1 = b.centerY + b.height / 2;
    const grad = lightCtx.createLinearGradient(x0, y0, x1, y1);
    grad.addColorStop(0, b.colors[0]);
    grad.addColorStop(0.5, b.colors[1]);
    grad.addColorStop(1, b.colors[2]);
    lightCtx.fillStyle = grad;

    switch (item.kind) {
      case 'text':
      case 'emoji': {
        lightCtx.font = fontString(fs, options.fontFamily);
        lightCtx.textAlign = 'center';
        lightCtx.textBaseline = 'middle';
        lightCtx.fillText(item.value, b.centerX, b.centerY);
        break;
      }
      case 'shape':
        drawShape(lightCtx, item.value, b, fs);
        break;
      case 'path': {
        const path = new Path2D(item.value);
        lightCtx.save();
        lightCtx.translate(b.centerX, b.centerY);
        // NOTE: scales by fontSize/100 — assumes the SVG path is authored near
        // the origin with a ~100-unit scale. See README limitations.
        lightCtx.scale(fs / 100, fs / 100);
        lightCtx.fill(path);
        lightCtx.restore();
        break;
      }
    }
  }

  function drawBody(b: Body, nowMs: number): void {
    const progress =
      options.introDurationMs > 0
        ? (nowMs - b.introStart) / options.introDurationMs
        : 1;
    const intro = easeOutCubic(progress);
    if (intro <= 1e-4) return;

    // Treat `glowStrength` as a STRENGTH, not an opacity: >1 layers the same body
    // multiple times with additive compositing so it reads brighter / glowing.
    const strength = options.glowStrength;
    const layers = Math.max(1, Math.ceil(strength));
    const perLayer = Math.min(1, strength) * intro;

    for (let i = 0; i < layers; i++) {
      lightCtx.save();
      lightCtx.globalCompositeOperation = i === 0 ? 'source-over' : 'lighter';
      lightCtx.globalAlpha = perLayer;
      paintBodyShape(b);
      lightCtx.restore();
    }
  }

  function render(nowMs: number): void {
    if (!sizeKnown || cssWidth <= 0) return;

    lightCtx.clearRect(0, 0, cssWidth, cssHeight);
    for (const b of bodies) drawBody(b, nowMs);

    lightCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    lightCtx.globalCompositeOperation = 'destination-in';
    lightCtx.globalAlpha = 1;
    lightCtx.drawImage(maskCanvas, 0, 0, cssWidth, cssHeight);
    lightCtx.globalCompositeOperation = 'source-over';

    mainCtx.clearRect(0, 0, cssWidth, cssHeight);
    mainCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mainCtx.globalAlpha = 1;
    mainCtx.globalCompositeOperation = 'source-over';
    mainCtx.drawImage(bgCanvas, 0, 0, cssWidth, cssHeight);
    mainCtx.drawImage(lightCanvas, 0, 0, cssWidth, cssHeight);
  }

  function stepMotion(active: Body[], dt: number): void {
    const mode = options.motion;
    if (mode === 'static') return;
    if (mode === 'drift') {
      stepBodies(active, dt, cssWidth, cssHeight, edgePadding);
      return;
    }
    if (mode === 'roam') {
      stepRoam(active, dt, cssWidth, cssHeight, edgePadding);
      return;
    }
    const dir: 1 | -1 = mode === 'ticker-left' ? 1 : -1;
    let sumW = 0;
    for (const b of bodies) sumW += b.width;
    const track = sumW + tickerGapPx * bodies.length;
    stepTicker(active, dt, cssWidth, dir, tickerGapPx, track);
  }

  function frame(timestamp: number): void {
    if (!running) return;
    rafId = requestAnimationFrame(frame);
    if (!sizeKnown || cssWidth <= 0) return;
    if (lastTime == null) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) / 1000, 0.034);
    lastTime = timestamp;
    const active = bodies.filter(
      (b) => timestamp - b.introStart >= options.introDurationMs,
    );
    stepMotion(active, dt);
    render(timestamp);
  }

  function start(): void {
    if (running) return;
    running = true;
    lastTime = null;
    rafId = requestAnimationFrame(frame);
  }

  function stop(): void {
    if (!running) return;
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function resize(w?: number, h?: number): void {
    let width = w;
    let height = h;
    if (width == null || height == null) {
      const rect = container?.getBoundingClientRect();
      if (rect) {
        width = width ?? rect.width;
        height = height ?? rect.height;
      }
    }
    if (!width || !height || width <= 0 || height <= 0) {
      sizeKnown = false;
      return;
    }
    cssWidth = width;
    cssHeight = height;
    computeGeometry();
    setCanvasSize(canvas, mainCtx);
    setCanvasSize(bgCanvas, bgCtx);
    setCanvasSize(maskCanvas, maskCtx);
    setCanvasSize(lightCanvas, lightCtx);
    if (pendingItems) {
      rebuildBodies();
    } else if (bodies.length) {
      refreshBodySizes();
    }
    redrawStatic();
    applyBackground();
    sizeKnown = true;
    if (running) render(typeof performance !== 'undefined' ? performance.now() : 0);
  }

  function configure(next: CoreOptions): void {
    const itemsChanged = next.items !== options.items;
    const tickerChanged =
      isTickerMotion(next.motion) !== isTickerMotion(options.motion);
    options = next;
    if (sizeKnown) computeGeometry();

    // Theme / color hot-update: keep physics, just recolor each body.
    if (!itemsChanged && !tickerChanged && bodies.length) {
      for (const b of bodies) {
        b.colors = [options.glow[0], options.glow[1], options.glow[2]];
      }
    }

    // Rebuild only when the body *layout* changes (items or entering/leaving the
    // ticker track). Switching between drift/roam/static keeps positions/velocities.
    if (itemsChanged || tickerChanged) {
      pendingItems = options.items;
      if (sizeKnown) rebuildBodies();
    } else if (sizeKnown) {
      refreshBodySizes();
    }

    if (sizeKnown) {
      redrawStatic();
      applyBackground();
      // Repaint immediately so a paused theme change still shows.
      render(typeof performance !== 'undefined' ? performance.now() : 0);
    }
  }

  function onVisibility(): void {
    if (typeof document === 'undefined') return;
    if (document.hidden) stop();
    else start();
  }

  // Initial paint attempt (adapter with `observeResize: false` relies on resize()).
  resize();

  if (observeResize && typeof ResizeObserver !== 'undefined' && container) {
    ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const rect = entry.contentRect;
      resize(rect.width, rect.height);
    });
    ro.observe(container);
    document.addEventListener('visibilitychange', onVisibility);
  }

  return {
    configure,
    resize,
    start,
    stop,
    destroy() {
      stop();
      if (ro) {
        ro.disconnect();
        ro = null;
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibility);
      }
    },
  };
}
