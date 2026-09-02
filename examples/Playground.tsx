import { useMemo, useState } from 'react';
import { Dotmote, resolveTheme } from '../src';
import type { DotmoteProps, MotionMode, ThemeConfig, ThemePreset } from '../src';
import './playground.css';

const THEMES: ThemePreset[] = ['auto', 'light', 'dark', 'mono', 'gradient'];
const MOTIONS: MotionMode[] = ['drift', 'roam', 'static', 'ticker-left', 'ticker-right'];

type Lang = 'en' | 'zh';

interface Strings {
  subtitle: string;
  theme: string;
  content: string;
  motion: string;
  speed: string;
  glow: string;
  dotRadius: string;
  fontSize: string;
  spacing: string;
  dotColor: string;
  activeDot: string;
  auto: string;
  usage: string;
  copy: string;
  copied: string;
  expand: string;
  collapse: string;
  contentPlaceholder: string;
}

const STRINGS: Record<Lang, Strings> = {
  en: {
    subtitle: 'LED dot-matrix component',
    theme: 'Theme',
    content: 'Content',
    motion: 'Motion',
    speed: 'speed',
    glow: 'glow',
    dotRadius: 'dotRadius',
    fontSize: 'fontSize',
    spacing: 'spacing',
    dotColor: 'dotColor',
    activeDot: 'activeDot',
    auto: 'auto',
    usage: 'Usage example',
    copy: 'Copy',
    copied: 'Copied ✓',
    expand: 'Expand',
    collapse: 'Collapse',
    contentPlaceholder: 'Type content…',
  },
  zh: {
    subtitle: 'LED 点阵屏组件',
    theme: '主题',
    content: '内容',
    motion: '动效',
    speed: '速度',
    glow: '辉光',
    dotRadius: '点半径',
    fontSize: '字符大小',
    spacing: '间距',
    dotColor: '点颜色',
    activeDot: '高亮点',
    auto: '自动',
    usage: '使用示例',
    copy: '复制',
    copied: '已复制 ✓',
    expand: '展开',
    collapse: '收起',
    contentPlaceholder: '输入内容…',
  },
};

const LANGS: { value: Lang; label: string }[] = [
  { value: 'zh', label: '简体中文' },
  { value: 'en', label: 'English' },
];

function detectLang(): Lang {
  if (typeof navigator === 'undefined') return 'en';
  const locales =
    navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language];
  for (const locale of locales) {
    if (locale && locale.toLowerCase().startsWith('zh')) return 'zh';
  }
  return 'en';
}

/** Convert an rgb/rgba/hex color to `#rrggbb` so it can feed `<input type="color">`. */
function cssColorToHex(c: string | undefined, fallback: string): string {
  if (!c) return fallback;
  if (/^#[0-9a-fA-F]{6}$/.test(c)) return c;
  const m = c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return fallback;
  const h = (n: string) => (+n).toString(16).padStart(2, '0');
  return `#${h(m[1])}${h(m[2])}${h(m[3])}`;
}

function valuesAttr(v: string): string {
  return /["\n<>&]/.test(v) ? `values={${JSON.stringify(v)}}` : `values="${v}"`;
}

function themeAttr(theme: ThemeConfig | ThemePreset): string {
  if (typeof theme === 'string') return `theme="${theme}"`;
  const parts: string[] = [];
  if (theme.dotColor !== undefined) parts.push(`dotColor: ${JSON.stringify(theme.dotColor)}`);
  if (theme.activeDotColor !== undefined) parts.push(`activeDotColor: ${JSON.stringify(theme.activeDotColor)}`);
  if (theme.glow) parts.push(`glow: ${JSON.stringify(theme.glow)}`);
  if (theme.background) parts.push(`background: ${JSON.stringify(theme.background)}`);
  return `theme={{ ${parts.join(', ')} }}`;
}

interface UsageState {
  theme: ThemeConfig | ThemePreset;
  values: string;
  speed: number;
  motion: MotionMode;
  glowStrength: number;
  dotRadius: number | undefined;
  fontSize: number | undefined;
  spacingScale: number;
}

function buildUsageCode(p: UsageState): string {
  const f: string[] = [];
  if (p.theme !== 'auto') f.push(themeAttr(p.theme));
  if (p.values.trim()) f.push(valuesAttr(p.values));
  if (p.speed !== 1) f.push(`speed={${p.speed}}`);
  if (p.motion !== 'drift') f.push(`motion="${p.motion}"`);
  if (p.glowStrength !== 1) f.push(`glowStrength={${p.glowStrength}}`);
  if (p.dotRadius !== undefined) f.push(`dotRadius={${p.dotRadius}}`);
  if (p.fontSize !== undefined) f.push(`fontSize={${p.fontSize}}`);
  if (p.spacingScale !== 1) f.push(`spacingScale={${p.spacingScale}}`);

  const header = "import { Dotmote } from 'dotmote';\n\n";
  const attrs = f.length ? `\n  ${f.join('\n  ')}\n` : '';
  return `${header}<Dotmote${attrs} />`;
}

const INSTALL = 'npm install dotmote';

// lucide "maximize" (expand / fullscreen) and "minimize" (collapse) icons.
const ExpandIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
    <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
    <path d="M3 16v3a2 2 0 0 0 2 2h3" />
    <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
  </svg>
);

const CollapseIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M8 3v3a2 2 0 0 1-2 2H3" />
    <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
    <path d="M3 16h3a2 2 0 0 1 2 2v3" />
    <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
  </svg>
);

export function App() {
  const [theme, setTheme] = useState<ThemePreset>('auto');
  const [content, setContent] = useState('👋dotmote!');
  const [speed, setSpeed] = useState(1);
  const [motion, setMotion] = useState<MotionMode>('drift');
  const [glowStrength, setGlowStrength] = useState(1);
  const [dotRadius, setDotRadius] = useState<number | undefined>(undefined);
  const [dotColor, setDotColor] = useState<string | undefined>(undefined);
  const [activeDotColor, setActiveDotColor] = useState<string | undefined>(undefined);
  const [spacingScale, setSpacingScale] = useState(1);
  const [fontSize, setFontSize] = useState<number | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [lang, setLang] = useState<Lang>(detectLang);
  const t = STRINGS[lang];

  const resolvedTheme: ThemeConfig | ThemePreset = useMemo(() => {
    if (dotColor === undefined && activeDotColor === undefined) return theme;
    const base = resolveTheme(theme);
    return {
      ...base,
      ...(dotColor !== undefined ? { dotColor } : {}),
      ...(activeDotColor !== undefined ? { activeDotColor } : {}),
    };
  }, [theme, dotColor, activeDotColor]);

  // Current theme's default colors, so the two swatches auto-follow the theme
  // (until the user overrides them). `auto` resolves to the light defaults here.
  const themeCfg = resolveTheme(theme);
  const dotSwatch = cssColorToHex(dotColor ?? themeCfg.dotColor, '#808080');
  const activeSwatch = cssColorToHex(
    activeDotColor ?? (themeCfg.activeDotColor ?? themeCfg.glow?.[1]),
    '#a09f9f',
  );

  const props: DotmoteProps = {
    theme: resolvedTheme,
    values: content,
    speed,
    motion,
    glowStrength,
    dotRadius,
    fontSize,
    spacingScale,
  };

  const usage = useMemo(
    () =>
      buildUsageCode({
        theme: resolvedTheme,
        values: content,
        speed,
        motion,
        glowStrength,
        dotRadius,
        fontSize,
        spacingScale,
      }),
    [resolvedTheme, content, speed, motion, glowStrength, dotRadius, fontSize, spacingScale],
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

      <div className={collapsed ? 'panel collapsed' : 'panel'}>
        <div className="panel-head">
          <div className="head-copy">
            <h1>dotmote</h1>
            <p className="subtitle">{t.subtitle}</p>
          </div>
          <div className="head-actions">
            <button
              className="icon-btn"
              onClick={() => setCollapsed((c) => !c)}
              title={collapsed ? t.expand : t.collapse}
              aria-label={collapsed ? t.expand : t.collapse}
            >
              {collapsed ? <ExpandIcon /> : <CollapseIcon />}
            </button>
            {!collapsed && (
              <select
                className="lang-select"
                value={lang}
                onChange={(e) => setLang(e.target.value as Lang)}
                aria-label="Language"
              >
                {LANGS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className={collapsed ? 'panel-body hidden' : 'panel-body'}>
          <div className="col config">
            <div className="cfg-row">
              <span className="cfg-label">{t.theme}</span>
              <div className="chip-row">
                {THEMES.map((t) => (
                  <button
                    key={t}
                    className={theme === t ? 'on' : ''}
                    onClick={() => {
                      setTheme(t);
                      setDotColor(undefined);
                      setActiveDotColor(undefined);
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="cfg-row">
              <span className="cfg-label">{t.content}</span>
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t.contentPlaceholder}
              />
            </div>
            <div className="cfg-row">
              <span className="cfg-label">{t.motion}</span>
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
                {t.speed}&nbsp;<b>{speed.toFixed(2)}</b>
              </span>
              <input type="range" min={0.2} max={3} step={0.05} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
            </div>
            <div className="cfg-row">
              <span className="cfg-label">
                {t.glow}&nbsp;<b>{glowStrength.toFixed(2)}</b>
              </span>
              <input type="range" min={0} max={3} step={0.1} value={glowStrength} onChange={(e) => setGlowStrength(Number(e.target.value))} />
            </div>
            <div className="cfg-row">
              <span className="cfg-label">
                {t.dotRadius}&nbsp;<b>{dotRadius ?? t.auto}</b>
              </span>
              <div className="range-wrap">
                <input type="range" min={0} max={4} step={0.25} value={dotRadius ?? 0} onChange={(e) => setDotRadius(Number(e.target.value) || undefined)} />
                <button className="tiny" onClick={() => setDotRadius(undefined)}>{t.auto}</button>
              </div>
            </div>
            <div className="cfg-row">
              <span className="cfg-label">
                {t.fontSize}&nbsp;<b>{fontSize ?? t.auto}</b>
              </span>
              <div className="range-wrap">
                <input type="range" min={80} max={320} step={4} value={fontSize ?? 0} onChange={(e) => setFontSize(Number(e.target.value) || undefined)} />
                <button className="tiny" onClick={() => setFontSize(undefined)}>{t.auto}</button>
              </div>
            </div>
            <div className="cfg-row two">
              <div className="color-group">
                <span className="cfg-label">{t.dotColor}</span>
                <div className="color-row">
                  <input type="color" value={dotSwatch} onChange={(e) => setDotColor(e.target.value)} />
                  <button className="tiny" onClick={() => setDotColor(undefined)}>{t.auto}</button>
                </div>
              </div>
              <div className="color-group">
                <span className="cfg-label">{t.activeDot}</span>
                <div className="color-row">
                  <input type="color" value={activeSwatch} onChange={(e) => setActiveDotColor(e.target.value)} />
                  <button className="tiny" onClick={() => setActiveDotColor(undefined)}>{t.auto}</button>
                </div>
              </div>
            </div>
            <div className="cfg-row">
              <span className="cfg-label">
                {t.spacing}&nbsp;<b>{spacingScale.toFixed(2)}</b>
              </span>
              <input type="range" min={0.3} max={3} step={0.05} value={spacingScale} onChange={(e) => setSpacingScale(Number(e.target.value))} />
            </div>
          </div>

          <div className="col usage">
            <div className="usage-head">
              <span>{t.usage}</span>
              <button className="copy-btn" onClick={copy}>
                {copied ? t.copied : t.copy}
              </button>
            </div>
            <pre className="code code-install">
              <code>{INSTALL}</code>
            </pre>
            <pre className="code">
              <code>{usage}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
