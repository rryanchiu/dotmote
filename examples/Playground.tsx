import { useMemo, useState } from 'react';
import { Dotmote } from '../src';
import type { ContentInput, DotmoteProps, MotionMode, ThemeConfig, ThemePreset } from '../src';
import './playground.css';

const THEMES: ThemePreset[] = ['mono', 'light', 'dark', 'gradient', 'rainbow'];
const MOTIONS: MotionMode[] = ['drift', 'roam', 'static', 'ticker-left', 'ticker-right'];

const ITEM_PRESETS: Record<string, ContentInput[]> = {
  letters: ['A', 'B', 'C', 'D', 'E'],
  hello: ['H', 'i', '👋'],
  emoji: ['🌊', '🔥', '⭐', '🌙'],
  shapes: [
    { kind: 'shape', value: 'circle' },
    { kind: 'shape', value: 'square' },
    { kind: 'shape', value: 'triangle' },
    { kind: 'shape', value: 'star' },
    { kind: 'shape', value: 'diamond' },
  ],
};

const DEFAULT_LETTERS = ['A', 'B', 'C', 'D', 'E'];

function toHex(c: string | undefined, fallback: string): string {
  return typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c) ? c : fallback;
}

function isDefaultItems(items: ContentInput[]): boolean {
  return (
    items.length === DEFAULT_LETTERS.length &&
    items.every((it, i) => it === DEFAULT_LETTERS[i])
  );
}

function serializeItem(it: { kind: string; value?: unknown; radius?: number }): string {
  const parts = [`kind: ${JSON.stringify(it.kind)}`];
  if (it.value !== undefined) parts.push(`value: ${JSON.stringify(it.value)}`);
  if (it.radius !== undefined) parts.push(`radius: ${it.radius}`);
  return `{ ${parts.join(', ')} }`;
}

function serializeItems(items: ContentInput[]): string {
  return `[${items
    .map((it) => (typeof it === 'string' ? JSON.stringify(it) : serializeItem(it)))
    .join(', ')}]`;
}

interface UsageState {
  theme: ThemeConfig | ThemePreset;
  items: ContentInput[];
  speed: number;
  motion: MotionMode;
  glowStrength: number;
  dotRadius: number | undefined;
  dotColor: string | undefined;
  activeDotColor: string | undefined;
  spacingScale: number;
}

function buildUsageCode(p: UsageState): string {
  const f: string[] = [];
  if (p.theme !== 'mono') {
    if (typeof p.theme === 'string') {
      f.push(`theme="${p.theme}"`);
    } else {
      const dot = p.theme.dot ?? 'rgba(128, 128, 128, 0.5)';
      f.push(`theme={{ dot: ${JSON.stringify(dot)}, glow: ${JSON.stringify(p.theme.glow)} }}`);
    }
  }
  if (!isDefaultItems(p.items)) f.push(`items={${serializeItems(p.items)}}`);
  if (p.speed !== 1) f.push(`speed={${p.speed}}`);
  if (p.motion !== 'drift') f.push(`motion="${p.motion}"`);
  if (p.glowStrength !== 1) f.push(`glowStrength={${p.glowStrength}}`);
  if (p.dotRadius !== undefined) f.push(`dotRadius={${p.dotRadius}}`);
  if (p.dotColor !== undefined) f.push(`dotColor="${p.dotColor}"`);
  if (p.activeDotColor !== undefined) f.push(`activeDotColor="${p.activeDotColor}"`);
  if (p.spacingScale !== 1) f.push(`spacingScale={${p.spacingScale}}`);

  const header = "import { Dotmote } from 'dotmote';\n\n";
  const attrs = f.length ? `\n  ${f.join('\n  ')}\n` : '';
  return `${header}<Dotmote${attrs} />`;
}

export function App() {
  const [theme, setTheme] = useState<ThemePreset>('gradient');
  const [itemKey, setItemKey] = useState<keyof typeof ITEM_PRESETS>('letters');
  const [speed, setSpeed] = useState(1);
  const [motion, setMotion] = useState<MotionMode>('drift');
  const [glowStrength, setGlowStrength] = useState(1);
  const [dotRadius, setDotRadius] = useState<number | undefined>(undefined);
  const [dotColor, setDotColor] = useState<string | undefined>(undefined);
  const [activeDotColor, setActiveDotColor] = useState<string | undefined>(undefined);
  const [spacingScale, setSpacingScale] = useState(1);
  const [copied, setCopied] = useState(false);

  const resolvedTheme: ThemeConfig | ThemePreset = useMemo(() => {
    if (theme !== 'gradient') return theme;
    return {
      dot: 'rgba(128, 128, 128, 0.5)',
      glow: ['rgba(56, 189, 248, 0.9)', 'rgba(99, 102, 241, 0.9)', 'rgba(236, 72, 153, 0.9)'],
    };
  }, [theme]);

  const props: DotmoteProps = {
    theme: resolvedTheme,
    items: ITEM_PRESETS[itemKey],
    speed,
    motion,
    glowStrength,
    dotRadius,
    dotColor,
    activeDotColor,
    spacingScale,
  };

  const usage = useMemo(
    () =>
      buildUsageCode({
        theme: resolvedTheme,
        items: ITEM_PRESETS[itemKey],
        speed,
        motion,
        glowStrength,
        dotRadius,
        dotColor,
        activeDotColor,
        spacingScale,
      }),
    [resolvedTheme, itemKey, speed, motion, glowStrength, dotRadius, dotColor, activeDotColor, spacingScale],
  );

  function copy() {
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = usage;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
      document.body.removeChild(ta);
      setCopied(ok);
      if (ok) window.setTimeout(() => setCopied(false), 1500);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(usage).then(
        () => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        },
        () => fallback(),
      );
    } else {
      fallback();
    }
  }

  return (
    <div className="page">
      <div className="backdrop-wrap">
        <Dotmote {...props} />
      </div>

      <div className="panel">
        <div className="panel-head">
          <h1>dotmote</h1>
          <p className="subtitle">Dotted-matrix glow background · React + Canvas</p>
        </div>

        <div className="panel-body">
          <div className="col config">
            <div className="cfg-row">
              <span className="cfg-label">Theme</span>
              <div className="chip-row">
                {THEMES.map((t) => (
                  <button key={t} className={theme === t ? 'on' : ''} onClick={() => setTheme(t)}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="cfg-row">
              <span className="cfg-label">Content</span>
              <div className="chip-row">
                {(Object.keys(ITEM_PRESETS) as (keyof typeof ITEM_PRESETS)[]).map((k) => (
                  <button key={k} className={itemKey === k ? 'on' : ''} onClick={() => setItemKey(k)}>
                    {k}
                  </button>
                ))}
              </div>
            </div>
            <div className="cfg-row">
              <span className="cfg-label">Motion</span>
              <div className="chip-row">
                {MOTIONS.map((m) => (
                  <button key={m} className={motion === m ? 'on' : ''} onClick={() => setMotion(m)}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="cfg-row">
              <span className="cfg-label">
                speed&nbsp;<b>{speed.toFixed(2)}</b>
              </span>
              <input type="range" min={0.2} max={3} step={0.05} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
            </div>
            <div className="cfg-row">
              <span className="cfg-label">
                glow&nbsp;<b>{glowStrength.toFixed(2)}</b>
              </span>
              <input type="range" min={0} max={3} step={0.1} value={glowStrength} onChange={(e) => setGlowStrength(Number(e.target.value))} />
            </div>
            <div className="cfg-row">
              <span className="cfg-label">
                dotRadius&nbsp;<b>{dotRadius ?? 'auto'}</b>
              </span>
              <div className="range-wrap">
                <input type="range" min={0} max={4} step={0.25} value={dotRadius ?? 0} onChange={(e) => setDotRadius(Number(e.target.value) || undefined)} />
                <button className="tiny" onClick={() => setDotRadius(undefined)}>auto</button>
              </div>
            </div>
            <div className="cfg-row two">
              <div className="color-group">
                <span className="cfg-label">dotColor</span>
                <div className="color-row">
                  <input type="color" value={toHex(dotColor, '#808080')} onChange={(e) => setDotColor(e.target.value)} />
                  <button className="tiny" onClick={() => setDotColor(undefined)}>auto</button>
                </div>
              </div>
              <div className="color-group">
                <span className="cfg-label">activeDot</span>
                <div className="color-row">
                  <input type="color" value={toHex(activeDotColor, '#a09f9f')} onChange={(e) => setActiveDotColor(e.target.value)} />
                  <button className="tiny" onClick={() => setActiveDotColor(undefined)}>auto</button>
                </div>
              </div>
            </div>
            <div className="cfg-row">
              <span className="cfg-label">
                spacing&nbsp;<b>{spacingScale.toFixed(2)}</b>
              </span>
              <input type="range" min={0.3} max={3} step={0.05} value={spacingScale} onChange={(e) => setSpacingScale(Number(e.target.value))} />
            </div>
          </div>

          <div className="col usage">
            <div className="usage-head">
              <span>使用示例</span>
              <button className="copy-btn" onClick={copy}>
                {copied ? '已复制 ✓' : '复制'}
              </button>
            </div>
            <pre className="code">
              <code>{usage}</code>
            </pre>
          </div>
        </div>

        <p className="hint">
          拖动窗口跨过 372 / 640px 可看到断点；content 切到 shapes / emoji 验证对应渲染器；motion 切到
          ticker-left / ticker-right 看广告屏滚动。
        </p>
      </div>
    </div>
  );
}
