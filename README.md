# dotmote

<img src="https://raw.githubusercontent.com/rryanchiu/dotmote/main/docs/example.png" alt="dotmote — LED dot-matrix glow component" width="100%" />

<p align="center">
  <a href="https://www.npmjs.com/package/dotmote"><img alt="npm" src="https://img.shields.io/npm/v/dotmote" /></a>
  <img alt="license" src="https://img.shields.io/npm/l/dotmote" />
  <img alt="bundle size" src="https://img.shields.io/bundlephobia/minzip/dotmote" />
  <a href="https://dotmote.imryan.dev"><img alt="Live demo" src="https://img.shields.io/badge/Live%20demo-dotmote.imryan.dev-2ea44f" /></a>
  <a href="https://stackblitz.com/github/rryanchiu/dotmote"><img alt="Open in StackBlitz" src="https://img.shields.io/badge/Open%20in-StackBlitz-1269D3" /></a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/rryanchiu/dotmote/main/docs/dotmote.gif" alt="dotmote demo" width="200" />
</p>

<p align="center"><a href="https://github.com/rryanchiu/dotmote/blob/main/README.md">English</a> · <a href="https://github.com/rryanchiu/dotmote/blob/main/README.zh-CN.md">简体中文</a></p>

> **Live demo** — [dotmote.imryan.dev](https://dotmote.imryan.dev) · **Try it live**: [Open in StackBlitz](https://stackblitz.com/github/rryanchiu/dotmote) to run the playground in your browser. You can also import this GitHub repo into CodeSandbox.

A framework-agnostic dotted-matrix glow background for React and Vue. Scatter a few letters, emoji, or shapes over an endless grid of dots — they drift, bump into each other, and glow through the lattice like a little light show.

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

## Vue

The Canvas core is framework-agnostic — React and Vue are both thin wrappers over
the same `createDotMatrixCore`. For Vue 3 use the `dotmote/vue` entry:

```vue
<script setup>
import { Dotmote } from 'dotmote/vue';
</script>

<template>
  <div style="position: relative; min-height: 40vh">
    <Dotmote values="👋dotmote!" theme="auto" motion="ticker-right" />
  </div>
</template>
```

`class` / `style` fall through to the wrapper `<div>`.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `values` | `string` | — | Content as a string — each character becomes one body (whitespace skipped). Shorthand for `items`. |
| `items` | `(ContentItem \| string)[]` | `['A','B','C','D','E']` | The bodies to drift. Strings become letters; see [Content](#content). |
| `theme` | `ThemePreset \| ThemeConfig` | `'auto'` | A preset name or an inline config (`dotColor`, `activeDotColor`, `glow`, `background`). `auto` picks `light`/`dark` from the OS. |
| `motion` | `MotionMode` | `'drift'` | How the bodies move — see [Motion](#motion). |
| `speed` | `number` | `1` | Global speed multiplier. |
| `glowStrength` | `number` | `1` | Glow strength: `<1` fades it, `>1` brightens. (`glowAlpha` is a deprecated alias.) |
| `dotRadius` | `number` | `spacing <= 9 ? 0.82 : 1` | Dot size in px. Bigger = chunkier dots. |
| `fontFamily` | `string` | `"Trebuchet MS", ui-rounded, sans-serif` | Font stack (weight/size are prefixed: `900 ${fontSize}px …`). |
| `fontSize` | `number` | — | Fixed character size in px. Overrides the auto size (and `fontSizeOverride`). |
| `fontSizeOverride` | `number \| ((w)=>number)` | — | Override the automatic font size. |
| `fontSizeMin` / `fontSizeMax` | `number` | `207` / `270` | Bounds of the automatic font clamp. |
| `breakpoints` | `Partial<Breakpoints>` | `{small:372, medium:640, …}` | Responsive geometry. |
| `spacingScale` | `number` | `1` | Lattice density — `<1` denser, `>1` sparser. |
| `charGap` | `number` | `auto` | Gap between characters in `ticker` / `static` rows (px). Omit for an auto compact spacing. |
| `introDurationMs` | `number` | `520` | Hold + fade-in period. |
| `className` / `class` / `style` | `string` / `string` / `CSSProperties` | — | Passed to the wrapper `<div>`. `class` is an alias for `className`. |
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

Presets: `auto`, `light`, `dark`, `mono`, `gradient`. `auto` (the default) follows
the OS `prefers-color-scheme` — leave `theme` out to use it. The quick start uses
`theme="gradient"`; pass `theme="mono"` for no background + neutral gray dots.

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
| `static` | frozen after the intro fade — laid out horizontally-aligned as a centered row |
| `ticker-left` / `ticker-right` | marquee: horizontally-aligned row at the center, scrolling and looping with even spacing |

## Development

```bash
npm install
npm run dev       # playground at http://localhost:5199/
npm test          # vitest (physics + item normalization)
npm run lint
npm run typecheck
npm run build     # tsc → dist/
```

The playground runs on any modern browser — resize across 372 / 640px to see the breakpoints, and open DevTools → Console to confirm the reload is clean.

## Deploy the demo

The playground (`examples/`) is a static Vite site; `npm run build:site` emits it to `site/`. The npm **library** is built separately with `npm run build` → `dist/` (that's what gets published to npm, not the site).

### GitHub Pages

1. Push the repo, then in Settings → **Pages → Source = "GitHub Actions"**.
2. The included `.github/workflows/pages.yml` builds the demo on every push and publishes it at `https://<user>.github.io/dotmote/` (base `/dotmote/`).

### Cloudflare Pages

1. Dashboard → **Workers & Pages → Create → Pages → Connect to Git** → pick the repo.
2. Build settings:
   - Build command: `npm run build:site`
   - Build output directory: `site`
3. Leave the base path empty — Cloudflare serves from the domain root, so no `--base` is needed.

## Architecture

A thin React wrapper over a framework-agnostic Canvas core. Four canvases: a dot lattice, its white alpha mask, the gradient-illuminated bodies, and the composite. The lattice and mask redraw only on resize; the glow composites every frame.

## Notes / limitations

- **ESM only** — no CommonJS build; use a bundler that supports ESM.
- **Emoji keep their own colors** — they ignore the glow gradient (text and shapes recolor).
- **`path` is basic** — feed a path already centered near the origin and scaled to ~±100 units.
- Collision is a simplified momentum swap, not a full physics impulse.

## License

MIT
