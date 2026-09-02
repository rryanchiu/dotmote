import type { Body, ContentInput, ContentItem, MotionMode } from '../types';

/**
 * Normalize loose `items` input into concrete {@link ContentItem}s.
 * Strings become `{ kind: 'text', value }`. Anything already shaped like a
 * `ContentItem` is passed through. Non-string / non-object values are dropped.
 */
export function normalizeItems(input?: ContentInput[]): ContentItem[] {
  if (!input || !Array.isArray(input)) return [];
  const out: ContentItem[] = [];
  for (const raw of input) {
    if (typeof raw === 'string') {
      if (raw.length === 0) continue;
      out.push({ kind: 'text', value: raw });
      continue;
    }
    if (raw && typeof raw === 'object' && 'kind' in raw) {
      const item = raw as ContentItem;
      if (item.kind === 'text' || item.kind === 'emoji') {
        if (item.value.length === 0) continue;
        out.push({ kind: item.kind, value: item.value });
      } else if (item.kind === 'shape') {
        out.push({
          kind: 'shape',
          value: item.value,
          ...(typeof item.radius === 'number' ? { radius: item.radius } : {}),
        });
      } else if (item.kind === 'path') {
        if (item.value.length === 0) continue;
        out.push({ kind: 'path', value: item.value });
      }
    }
  }
  return out;
}

/**
 * Reflect a body's velocity component when its center crosses a wall, and
 * clamp its center back onto the boundary line so it can't tunnel.
 *
 * `edgePadding` is the distance from each edge the body stays inside.
 */
export function bounce(
  body: Body,
  width: number,
  height: number,
  edgePadding: number,
): void {
  if (body.centerX < edgePadding) {
    body.centerX = edgePadding + (edgePadding - body.centerX);
    body.velocityX = Math.abs(body.velocityX);
  } else if (body.centerX > width - edgePadding) {
    body.centerX = width - edgePadding - (body.centerX - (width - edgePadding));
    body.velocityX = -Math.abs(body.velocityX);
  }

  if (body.centerY < edgePadding) {
    body.centerY = edgePadding + (edgePadding - body.centerY);
    body.velocityY = Math.abs(body.velocityY);
  } else if (body.centerY > height - edgePadding) {
    body.centerY = height - edgePadding - (body.centerY - (height - edgePadding));
    body.velocityY = -Math.abs(body.velocityY);
  }
}

/**
 * AABB collision test using half-sizes: two bodies overlap only when both
 * `x` and `y` spans intersect. Returns `true` when a collision was resolved.
 *
 * On overlap, the pair is separated along the axis of *smaller* overlap (each
 * moved by half the penetration, in opposite directions) and their velocity
 * components on that axis are **swapped** (a simplified exchange, per spec —
 * not a full elastic impulse).
 */
export function resolveCollision(
  a: Body,
  b: Body,
): boolean {
  const overlapX = a.width / 2 + b.width / 2 - Math.abs(b.centerX - a.centerX);
  const overlapY =
    a.height / 2 + b.height / 2 - Math.abs(b.centerY - a.centerY);

  if (overlapX <= 0 || overlapY <= 0) return false;

  if (overlapX < overlapY) {
    const sign = a.centerX === b.centerX ? 1 : Math.sign(b.centerX - a.centerX);
    const push = overlapX / 2;
    a.centerX -= sign * push;
    b.centerX += sign * push;
    const tmp = a.velocityX;
    a.velocityX = b.velocityX;
    b.velocityX = tmp;
  } else {
    const sign = a.centerY === b.centerY ? 1 : Math.sign(b.centerY - a.centerY);
    const push = overlapY / 2;
    a.centerY -= sign * push;
    b.centerY += sign * push;
    const tmp = a.velocityY;
    a.velocityY = b.velocityY;
    b.velocityY = tmp;
  }
  return true;
}

/**
 * Advance the *active* bodies by `dt` seconds: integrate position, bounce off
 * the walls, then pairwise-resolve collisions.
 *
 * Returns a NEW array of the same bodies so callers can pass a slice of their
 * `bodies` list (e.g. only the bodies whose intro has finished) without
 * mutating the source ordering.
 */
export function stepBodies(
  bodies: Body[],
  dt: number,
  width: number,
  height: number,
  edgePadding: number,
): void {
  if (dt <= 0) return;
  for (const body of bodies) {
    body.centerX += body.velocityX * dt;
    body.centerY += body.velocityY * dt;
    bounce(body, width, height, edgePadding);
  }
  // O(n^2) pairwise collision resolution. Fine for the small counts we use.
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      resolveCollision(bodies[i], bodies[j]);
    }
  }
}

/**
 * Advance bodies by `dt` seconds with WALL bounce only — no pairwise collision,
 * so bodies can pass through each other (the `roam` motion).
 */
export function stepRoam(
  bodies: Body[],
  dt: number,
  width: number,
  height: number,
  edgePadding: number,
): void {
  if (dt <= 0) return;
  for (const body of bodies) {
    body.centerX += body.velocityX * dt;
    body.centerY += body.velocityY * dt;
    bounce(body, width, height, edgePadding);
  }
}

/**
 * Advance bodies for the horizontal ticker (marquee) modes: move along X (the
 * velocity already encodes direction) and wrap around a horizontal track.
 *
 * `dir` is `+1` for left→right and `-1` for right→left; `gap` is the padding
 * between a body and the screen edge that triggers a wrap. `track` is the loop
 * length (sum of body widths + `n * gap`), which keeps the first/last gap even.
 */
export function stepTicker(
  bodies: Body[],
  dt: number,
  width: number,
  dir: 1 | -1,
  gap: number,
  track?: number,
): void {
  if (dt <= 0) return;
  const loop = track && track > 0 ? track : width + 2 * gap;
  for (const body of bodies) {
    body.centerX += body.velocityX * dt;
    if (dir > 0) {
      if (body.centerX - body.width / 2 > width + gap) {
        body.centerX -= loop;
      }
    } else {
      if (body.centerX + body.width / 2 < -gap) {
        body.centerX += loop;
      }
    }
  }
}

/** Whether a motion mode is one of the horizontal ticker (marquee) modes. */
export function isTickerMotion(mode: MotionMode): boolean {
  return mode === 'ticker-left' || mode === 'ticker-right';
}

/**
 * Clamp a value into `[min, max]`.
 */
export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/**
 * A short ease-out curve for the intro fade-in (0..1 input → 0..1 output).
 */
export function easeOutCubic(t: number): number {
  const x = clamp(t, 0, 1);
  return 1 - Math.pow(1 - x, 3);
}
