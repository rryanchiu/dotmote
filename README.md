# dotmote

<p>
  <a href="https://www.npmjs.com/package/dotmote"><img alt="npm" src="https://img.shields.io/npm/v/dotmote" /></a>
  <img alt="license" src="https://img.shields.io/npm/l/dotmote" />
  <img alt="bundle size" src="https://img.shields.io/bundlephobia/minzip/dotmote" />
</p>

**[English](README.md)** · [简体中文](README.zh-CN.md)

A dotted-matrix glow background for React. Scatter a few letters, emoji, or shapes over an endless grid of dots — they drift, bump into each other, and glow through the lattice like a little light show.

- **React 18+** · TypeScript · Canvas 2D · **SSR-safe**
- **Zero runtime deps** — just `react` (peer)
- Pure Canvas 2D — no particle or dot-grid libraries

## Install

```bash
npm install dotmote
```

Requires `react >= 18`. Ships ESM + TypeScript types.

## Quick start

```tsx
import { Dotmote } from 'dotmote';

export function Page() {
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <Dotmote theme="gradient" />

      <main style={{ position: 'relative', zIndex: 1, padding: 24 }}>
        <h1>My page</h1>
      </main>
    </div>
  );
}
```

The wrapper `<div>` is absolutely positioned behind everything — put your content in a sibling with a higher `z-index`.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `values` | `string` | — | Content as a string — each character becomes one body (whitespace skipped). Shorthand for `items`. |
| `items` | `(ContentItem \| string)[]` | `['A','B','C','D','E']` | The bodies to drift. Strings become letters; see [Content](#content). |
| `theme` | `ThemePreset \| ThemeConfig` | `'mono'` | A preset name or an inline config (`dotColor`, `activeDotColor`, `glow`, `background`). |
| `motion` | `MotionMode` | `'drift'` | How the bodies move — see [Motion](#motion). |
| `speed` | `number` | `1` | Global speed multiplier. |
| `glowStrength` | `number` | `1` | Glow strength: `<1` fades it, `>1` brightens. (`glowAlpha` is a deprecated alias.) |
| `dotRadius` | `number` | `spacing <= 9 ? 0.82 : 1` | Dot size in px. Bigger = chunkier dots. |
| `fontFamily` | `string` | `"Trebuchet MS", ui-rounded, sans-serif` | Font stack (weight/size are prefixed: `900 ${fontSize}px …`). |
| `fontSizeOverride` | `number \| ((w)=>number)` | — | Override the automatic font size. |
| `fontSizeMin` / `fontSizeMax` | `number` | `207` / `270` | Bounds of the automatic font clamp. |
| `breakpoints` | `Partial<Breakpoints>` | `{small:372, medium:640, …}` | Responsive geometry. |
| `spacingScale` | `number` | `1` | Lattice density — `<1` denser, `>1` sparser. |
| `introDurationMs` | `number` | `520` | Hold + fade-in period. |
| `className` / `style` | `string` / `CSSProperties` | — | Passed to the wrapper `<div>`. |
| `ariaHidden` | `boolean` | `true` | `aria-hidden` on the wrapper. |

## Themes

Pick a neutral preset, or bring your own colors:

```tsx
<Dotmote theme="mono" />   // default
<Dotmote theme="dark" />
<Dotmote theme="gradient" />

<Dotmote
  theme={{
    dotColor: 'rgba(96, 165, 250, 0.6)',
    glow: ['rgba(56, 189, 248, 0.9)', 'rgba(99, 102, 241, 0.9)', 'rgba(236, 72, 153, 0.9)'],
    background: '#0b1020',
  }}
/>
```

Presets: `light`, `dark`, `mono`, `gradient`, `rainbow`.

```ts
interface ThemeConfig {
  dotColor?: string;       // lattice dot color
  activeDotColor?: string; // flat glow color (all 3 stops); omit to use `glow`
  glow: [string, string, string];
  background?: string;
}
```

Changing the theme hot-updates in place — the bodies keep their positions and motion.

## Content

`values` is the fastest way to fill the background — each character becomes a body:

```tsx
<Dotmote values="dotmote" />
<Dotmote values="🌊🔥⭐🌙" />
```

For per-body control, use `items`:

```tsx
<Dotmote items={['A', 'B', 'C', 'D', 'E']} />
<Dotmote items={[{ kind: 'shape', value: 'circle', radius: 60 }, { kind: 'emoji', value: '🌊' }]} />
```

```ts
type ContentItem =
  | { kind: 'text'; value: string }
  | { kind: 'emoji'; value: string }
  | { kind: 'shape'; value: 'circle' | 'square' | 'triangle' | 'star' | 'diamond'; radius?: number }
  | { kind: 'path'; value: string }; // SVG path
```

## Motion

| Mode | Behavior |
| --- | --- |
| `drift` | drift + wall bounce + pairs collide |
| `roam` | drift + bounce, bodies pass through each other |
| `static` | frozen after the intro fade |
| `ticker-left` / `ticker-right` | marquee: bodies line up in a row and scroll, looping |

## Development

```bash
npm install
npm run dev       # playground at http://localhost:5199/examples/index.html
npm test          # vitest (physics + item normalization)
npm run lint
npm run typecheck
npm run build     # tsc → dist/
```

The playground runs on any modern browser — resize across 372 / 640px to see the breakpoints, and open DevTools → Console to confirm the reload is clean.

## Architecture

A thin React wrapper over a framework-agnostic Canvas core. Four canvases: a dot lattice, its white alpha mask, the gradient-illuminated bodies, and the composite. The lattice and mask redraw only on resize; the glow composites every frame.

## Notes / limitations

- **ESM only** — no CommonJS build; use a bundler that supports ESM.
- **Emoji keep their own colors** — they ignore the glow gradient (text and shapes recolor).
- **`path` is basic** — feed a path already centered near the origin and scaled to ~±100 units.
- Collision is a simplified momentum swap, not a full physics impulse.

## License

MIT
