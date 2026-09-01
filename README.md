# dotmote

A **brand-agnostic** dotted-matrix glow background for React. It fills a
container (or the whole screen) with a lattice of dots, then drifts a few
customizable bodies — **letters, emoji, or geometric shapes** — *behind* the
dots. The bodies are revealed as glowing, **dot-assembled light blobs** that
bounce off the edges and swap speed when they collide.

- React 18+ · TypeScript · Canvas 2D
- **Zero runtime dependencies** other than `react` (peer).
- Original implementation — no `tsParticles`, `dot-grid-background`,
  `particles-js`, or `canvas-confetti`.
- **SSR-safe**: the component renders an empty `<canvas>` during server /
  static rendering; every `window` / `document` / `ResizeObserver` / DPR touch
  happens inside a `useEffect`.
- Clean teardown (`cancelAnimationFrame` + `ResizeObserver.disconnect()`);
  survives React StrictMode double-mount.

---

## Install

```bash
npm install dotmote
```

Requires `react >= 18` (peer dependency). The package ships ESM + TypeScript
declarations.

---

## Minimal usage

```tsx
import { Dotmote } from 'dotmote';

export function Page() {
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Sit behind your content: the wrapper is absolutely positioned. */}
      <Dotmote theme="gradient" />

      <main style={{ position: 'relative', zIndex: 1, padding: 24 }}>
        <h1>My page</h1>
      </main>
    </div>
  );
}
```

The component renders a wrapper `<div>` (absolute, `inset: 0`, `overflow:
hidden`, `pointer-events: none`) containing a full-size `<canvas>`. Put your
content in a sibling with a higher `z-index`.

---

## Props / API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `(ContentItem \| string)[]` | `['A','B','C','D','E']` | The bodies to drift. Strings become letters; see [Content](#content--emoji--shapes). |
| `theme` | `ThemePreset \| ThemeConfig` | `'mono'` | A preset name or an inline color config. |
| `dotColor` | `string` | `rgba(128,128,128,0.5)` | Overrides the lattice dot color (`theme.dot`). |
| `activeDotColor` | `string` | — | Color of the *illuminated* (lit) dots. When set, the glow is a flat color (all three gradient stops). Omit to use the theme's gradient glow. |
| `dotRadius` | `number` | `spacing <= 9 ? 0.82 : 1` | Dot radius in px. Larger = chunkier dots. |
| `glowStrength` | `number` | `1` | Glow **strength**: `<1` fades it, `>1` (up to ~3) layers it brighter via additive compositing. (`glowAlpha` is a deprecated alias.) |
| `speed` | `number` | `1` | Global speed multiplier. |
| `motion` | `MotionMode` | `'drift'` | Body animation — `drift` (collide), `roam` (no collide), `static`, `ticker-left`, `ticker-right`. See [Motion modes](#motion-modes). |
| `fontFamily` | `string` | `"Trebuchet MS", ui-rounded, sans-serif` | Font stack (weight/size are prefixed: `900 ${fontSize}px ${fontFamily}`). |
| `fontSizeOverride` | `number \| ((w:number)=>number)` | — | Override the automatic font size. |
| `fontSizeMin` | `number` | `207` | Low bound of the large-screen font clamp. |
| `fontSizeMax` | `number` | `270` | High bound of the large-screen font clamp. |
| `breakpoints` | `Partial<Breakpoints>` | `{small:372, medium:640, smallSpacing:8, mediumSpacing:9, largeSpacing:12}` | Responsive geometry. |
| `spacingScale` | `number` | `1` | Scale lattice density on top of the breakpoints. `<1` denser, `>1` sparser (also scales edge padding + default dot size). |
| `introDurationMs` | `number` | `520` | Hold/fade-in period (bodies stay frozen, then fade in). |
| `className` | `string` | — | Class on the wrapper `<div>`. |
| `style` | `CSSProperties` | — | Style merged onto the wrapper. |
| `ariaHidden` | `boolean` | `true` | `aria-hidden` on the wrapper. |

### Responsive breakpoints

| Container width | `spacing` | font size |
| --- | --- | --- |
| `< 372px` | `8` | `135` |
| `< 640px` | `9` | `162` |
| `>= 640px` | `12` | `clamp(width * 0.195, 207, 270)` |

`fontSizeMin` / `fontSizeMax` let you adjust the clamp's bounds. Override the
whole set with `breakpoints`.

### DPR

`min(window.devicePixelRatio || 1, 1.75)`. All four canvases are sized in
physical pixels and drawn through `setTransform(dpr, 0, 0, dpr, 0, 0)`, so
resizing never blurs.

### Motion modes

`motion` selects how the drifting bodies move:

| Mode | Behavior |
| --- | --- |
| `drift` (default) | Random drift + wall bounce + **pairwise collision** (velocity swap on the smaller overlap axis). |
| `roam` | Random drift + wall bounce, but bodies **pass through each other** (no collision). |
| `static` | Frozen after the intro fade-in (bodies sit at their initial positions). |
| `ticker-left` | Marquee / billboard: the bodies line up in a single centered row and **scroll left → right**, looping. |
| `ticker-right` | Same, but **scrolls right → left**. |

Changing between `drift` / `roam` / `static` keeps the current positions and
velocities; entering or leaving a `ticker` mode re-lays the bodies onto the
horizontal track.

```tsx
<Dotmote motion="ticker-right" items={['A','B','C','D','E']} />
```

---

## Themes

Presets are neutral and brand-free; swap them for your own palette with an
inline config.

- `light` — classic: white background with a gray dot lattice.
- `dark` — soft light dots on dark backdrops.
- `mono` — default; transparent neutral gray readable on any backdrop.
- `gradient` — a colorful (generic) gradient for demos.
- `rainbow` — a red → green → blue sweep for the illuminated dots.

```tsx
<Dotmote theme="mono" />     // default
<Dotmote theme="dark" />
<Dotmote theme="light" />
<Dotmote theme="gradient" />

// Or an inline config:
<Dotmote
  theme={{
    dot: 'rgba(96, 165, 250, 0.6)',
    glow: ['rgba(56, 189, 248, 0.9)', 'rgba(99, 102, 241, 0.9)', 'rgba(236, 72, 153, 0.9)'],
    background: '#0b1020',
  }}
/>
```

The `ThemeConfig` shape is:

```ts
interface ThemeConfig {
  dot?: string;                       // lattice dot color
  glow: [string, string, string];     // 3-stop gradient for the glow
  background?: string;                // element background behind the dots
}
```

`dotColor` / `glowStrength` / `dotRadius` override a theme individually. Changing
the theme or any color prop **hot-updates** — it re-renders the lattice/glow and
recolors the drifting bodies without resetting their positions or motion.

---

## Content / emoji / shapes

`items` accepts strings or full `ContentItem` objects:

```tsx
// Letters
<Dotmote items={['A', 'B', 'C', 'D', 'E']} />

// A word breaks into its own independent drifting body per item:
<Dotmote items={['Hi', 'there']} />

// Emoji (rendered in their own color via color fonts):
<Dotmote items={['🌊', '🔥', '⭐', '🌙']} />

// Shapes:
<Dotmote
  items={[
    { kind: 'shape', value: 'circle', radius: 60 },
    { kind: 'shape', value: 'square' },
    { kind: 'shape', value: 'triangle' },
    { kind: 'shape', value: 'star' },
    { kind: 'shape', value: 'diamond' },
  ]}
/>
```

### `ContentItem`

```ts
type ContentItem =
  | { kind: 'text'; value: string }
  | { kind: 'emoji'; value: string }
  | { kind: 'shape'; value: 'circle' | 'square' | 'triangle' | 'star' | 'diamond'; radius?: number }
  | { kind: 'path'; value: string };   // SVG path string
```

---

## How to verify in a browser

Run the playground (Vite dev server serving `examples/`):

```bash
npm install
npm run dev
```

Open `http://localhost:5199/examples/index.html`. Then check:

- **Breakpoints** — resize across 372 / 640px and confirm the lattice density
  and font size change (smaller screens get denser dots).
- **Drift & bounces** — bodies wander; watch them reflect off the edges and
  jostle each other (use `speed` to make it obvious).
- **Intro** — change content/theme and watch the bodies fade in over ~520ms.
- **Emoji & shapes** — the `emoji` and `shapes` content presets.
- **Theme switching** — click `mono` / `dark` / `gradient`; the glow recolors
  in place without the motion resetting.
- **Resize sharpness** — the dots stay crisp because the canvases are sized in
  device pixels.
- **Clean teardown** — open DevTools → Console and verify there are no errors
  when the page reloads (React StrictMode double-mounts the component in dev).

---

## CLI / static checks

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # vitest (physics + item normalization)
npm run build       # tsc -p tsconfig.build.json → dist/
```

---

## Architecture

The React component is a **thin wrapper** over a framework-agnostic Canvas
core, so the same core can be adapted to vanilla JS or a miniapp (which would
use `createOffscreenCanvas` and no `ResizeObserver`):

```
src/
  Dotmote.tsx      # <React> thin wrapper (empty canvas, effects only)
  themes.ts                    # neutral presets + resolveTheme()
  types.ts                     # all shared types
  core/
    createDotMatrixCore.ts     # 4-canvas render pipeline + physics + lifecycle
    physics.ts                 # pure, testable functions (bounce/collision/step)
    index.ts
  index.ts                     # package exports
```

### Render pipeline (exactly four canvases, three offscreen)

1. `backgroundCanvas` — the solid dot lattice (transparent background).
2. `dotMaskCanvas` — an identical **white** dot lattice used as an alpha mask.
3. `illuminationCanvas` — the drifting bodies painted with a gradient, then
   `globalCompositeOperation = 'destination-in'` + `drawImage(dotMaskCanvas)`,
   so light only escapes through the dot holes → the dot-assembled glow.
4. The visible `<canvas>` — `clearRect`, then `drawImage(backgroundCanvas)`,
   then `drawImage(illuminationCanvas)`.

The lattice and mask are redrawn **only on resize**; the illumination and the
composite are redrawn **every frame**. Motion uses `requestAnimationFrame`;
`document` visibility changes pause/resume the loop.

---

## Limitations (stated plainly)

- **SVG `path` support is basic.** A `kind: 'path'` body is drawn via
  `Path2D`, but the core does **not** compute the path's bounding box or
  auto-fit it. It assumes the path is authored roughly centered on the origin
  and scaled to about ±100 units, then scales it by `fontSize / 100`. Feed it a
  path that is already near the origin and reasonably sized, or expect it to
  render off-center / clipped. If you need reliable arbitrary paths, pass a
  measured `kind: 'shape'` or pre-normalize the path.
- **Emoji ignore the glow gradient.** Emoji use color fonts, so `fillStyle`
  cannot recolor them — they show their own colors, but the dot-matrix mask
  still applies. (Text and geometric shapes do pick up the gradient.)
- **`dotRadius` default is literal.** When omitted it is `spacing <= 9 ? 0.82 :
  1` (a small, subtle dot texture). If you want chunkier dots, pass
  `dotRadius` explicitly (e.g. `2`–`4`). A larger `dotRadius` makes the glowing
  blobs read more clearly.
- **Collision is a simplified swap.** On overlap, bodies separate along the
  axis of smaller overlap and *swap* that velocity component — this is exactly
  the spec's rule, not a full elastic impulse. Physically it looks like a
  momentum exchange but does not conserve energy.
- **"Random shapes" are your choice, not built in.** There is no hidden
  random-shape generator; you pass explicit `items`. To get randomized shapes
  you can build the array yourself (e.g. pick from the shape enum).
- **ESM only.** The package is published as ESM (`"type": "module"`); there is
  no CommonJS build. Use a bundler that supports ESM.
- The two extra props `fontSizeMin` / `fontSizeMax` were added to satisfy the
  "clamp bounds go through props" requirement from the spec (they were not in
  the original prop table). They're tiny, documented additions.

---

## License

MIT
