import { defineComponent, h, onBeforeUnmount, onMounted, watch } from 'vue';
import type { PropType } from 'vue';

import type {
  ContentInput,
  DotmoteProps,
  MotionMode,
  ThemeLike,
} from '../types.js';
import { createDotMatrixCore, type DotMatrixCoreHandle } from '../core/index.js';
import { buildOptions } from '../core/options.js';

const containerBase = {
  position: 'absolute',
  inset: '0',
  overflow: 'hidden',
  pointerEvents: 'none',
} as const;
const canvasStyle = { width: '100%', height: '100%', display: 'block' } as const;

/**
 * Vue 3 wrappers over the same framework-agnostic Canvas core as the React
 * component. Import via `import { Dotmote } from 'dotmote/vue'`.
 */
export const Dotmote = defineComponent({
  name: 'Dotmote',
  // Let `class` / `style` (and other attributes) fall through to the root div.
  inheritAttrs: false,
  props: {
    values: { type: String, default: undefined },
    items: { type: Array as PropType<ContentInput[]>, default: undefined },
    theme: { type: [String, Object] as PropType<ThemeLike>, default: undefined },
    dotRadius: { type: Number, default: undefined },
    glowStrength: { type: Number, default: undefined },
    glowAlpha: { type: Number, default: undefined },
    speed: { type: Number, default: undefined },
    motion: { type: String as PropType<MotionMode>, default: undefined },
    fontFamily: { type: String, default: undefined },
    fontSize: { type: Number, default: undefined },
    fontSizeOverride: {
      type: [Number, Function] as PropType<number | ((w: number) => number)>,
      default: undefined,
    },
    fontSizeMin: { type: Number, default: undefined },
    fontSizeMax: { type: Number, default: undefined },
    breakpoints: { type: Object, default: undefined },
    spacingScale: { type: Number, default: undefined },
    charGap: { type: Number, default: undefined },
    introDurationMs: { type: Number, default: undefined },
    ariaHidden: { type: Boolean, default: true },
  },
  setup(props, { attrs }) {
    let containerEl: HTMLDivElement | null = null;
    let canvasEl: HTMLCanvasElement | null = null;
    let core: DotMatrixCoreHandle | null = null;
    let mq: MediaQueryList | null = null;
    let dark = false;

    const resolve = () => buildOptions(props as unknown as DotmoteProps, dark);
    const onScheme = () => {
      dark = (mq as MediaQueryList).matches;
      core?.configure(resolve());
    };

    onMounted(() => {
      if (!canvasEl || !containerEl) return;
      if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
        mq = window.matchMedia('(prefers-color-scheme: dark)');
        dark = mq.matches;
        mq.addEventListener('change', onScheme);
      }
      core = createDotMatrixCore(canvasEl, containerEl, resolve());
      core.start();
    });

    watch(
      () => props,
      () => core?.configure(resolve()),
      { deep: true },
    );

    onBeforeUnmount(() => {
      core?.destroy();
      core = null;
      if (mq) {
        mq.removeEventListener('change', onScheme);
        mq = null;
      }
    });

    return () =>
      h(
        'div',
        {
          ...attrs,
          ref: (el: unknown) => {
            containerEl = el as HTMLDivElement;
          },
          style: [containerBase, (attrs.style as Record<string, unknown>) ?? null],
          'aria-hidden': props.ariaHidden,
        },
        [
          h('canvas', {
            ref: (el: unknown) => {
              canvasEl = el as HTMLCanvasElement;
            },
            style: canvasStyle,
          }),
        ],
      );
  },
});

export default Dotmote;
