import { describe, expect, it } from 'vitest';
import { bounce, isTickerMotion, resolveCollision, stepBodies, stepRoam, stepTicker } from '../src/core/physics';
import type { Body } from '../src';

function mkBody(overrides: Partial<Body>): Body {
  return {
    id: 0,
    item: { kind: 'text', value: 'A' },
    centerX: 0,
    centerY: 0,
    width: 40,
    height: 40,
    fontSize: 100,
    velocityX: 0,
    velocityY: 0,
    colors: ['a', 'b', 'c'],
    introStart: 0,
    ...overrides,
  };
}

describe('bounce (wall reflection)', () => {
  it('reflects velocity and clamps center at the left wall', () => {
    const body = mkBody({ centerX: 2, velocityX: -50 });
    bounce(body, 200, 200, 10);
    expect(body.velocityX).toBe(50);
    expect(body.centerX).toBeCloseTo(18); // 10 + (10 - 2)
  });

  it('reflects velocity and clamps center at the right wall', () => {
    const body = mkBody({ centerX: 198, velocityX: 50 });
    bounce(body, 200, 200, 10);
    expect(body.velocityX).toBe(-50);
    expect(body.centerX).toBeCloseTo(182); // 190 - (198 - 190)
  });

  it('reflects the vertical component too', () => {
    const body = mkBody({ centerY: 1, velocityY: -30 });
    bounce(body, 200, 200, 10);
    expect(body.velocityY).toBe(30);
  });

  it('leaves a body in-bounds alone', () => {
    const body = mkBody({ centerX: 100, centerY: 100, velocityX: 10, velocityY: -10 });
    bounce(body, 200, 200, 10);
    expect(body.centerX).toBe(100);
    expect(body.centerY).toBe(100);
    expect(body.velocityX).toBe(10);
    expect(body.velocityY).toBe(-10);
  });
});

describe('resolveCollision (AABB overlap)', () => {
  it('separates two overlapping bodies along the smaller-overlap axis and swaps that velocity', () => {
    const a = mkBody({ centerX: 100, centerY: 100, velocityX: 10, velocityY: 0 });
    const b = mkBody({ centerX: 130, centerY: 100, velocityX: -10, velocityY: 0 });

    const hit = resolveCollision(a, b);

    expect(hit).toBe(true);
    // width/height = 40 (half 20); overlapX = 40 - 30 = 10; overlapY = 40 → resolve on X.
    expect(a.centerX).toBeCloseTo(95);
    expect(b.centerX).toBeCloseTo(135);
    // velocity swapped on X
    expect(a.velocityX).toBe(-10);
    expect(b.velocityX).toBe(10);
    expect(a.velocityY).toBe(0);
    expect(b.velocityY).toBe(0);
  });

  it('resolves on Y when the vertical overlap is smaller', () => {
    const a = mkBody({ centerX: 100, centerY: 100, velocityX: 0, velocityY: 10 });
    const b = mkBody({ centerX: 100, centerY: 130, velocityX: 0, velocityY: -10 });

    const hit = resolveCollision(a, b);

    expect(hit).toBe(true);
    expect(a.centerY).toBeCloseTo(95);
    expect(b.centerY).toBeCloseTo(135);
    expect(a.velocityY).toBe(-10);
    expect(b.velocityY).toBe(10);
  });

  it('reports no collision when the boxes do not overlap', () => {
    const a = mkBody({ centerX: 100, centerY: 100 });
    const b = mkBody({ centerX: 100, centerY: 200 });
    expect(resolveCollision(a, b)).toBe(false);
  });
});

describe('stepBodies (integration + bounce + collision)', () => {
  it('advances positions by velocity * dt', () => {
    const a = mkBody({ centerX: 100, centerY: 100, velocityX: 50, velocityY: 0 });
    const bodies = [a];
    stepBodies(bodies, 0.1, 500, 500, 10);
    expect(a.centerX).toBeCloseTo(105);
    expect(a.centerY).toBeCloseTo(100);
  });

  it('bounces a fast-moving body off a wall without letting it tunnel', () => {
    const a = mkBody({ centerX: 495, centerY: 250, velocityX: 200, velocityY: 0 });
    const bodies = [a];
    stepBodies(bodies, 0.1, 500, 500, 10);
    // 495 + 20 = 515 → past the wall at 490, reflect.
    expect(a.velocityX).toBeLessThan(0);
    expect(a.centerX).toBeLessThanOrEqual(490);
  });

  it('resolves pairwise collisions between two bodies in one step', () => {
    const a = mkBody({ centerX: 100, centerY: 100, velocityX: 20, velocityY: 0 });
    const b = mkBody({ centerX: 120, centerY: 100, velocityX: -20, velocityY: 0 });
    stepBodies([a, b], 0.05, 500, 500, 10);
    // Moving toward each other, they should have swapped X velocities.
    expect(a.velocityX).toBe(-20);
    expect(b.velocityX).toBe(20);
  });

  it('does nothing for a zero or negative dt', () => {
    const a = mkBody({ centerX: 100, centerY: 100, velocityX: 50, velocityY: 0 });
    stepBodies([a], 0, 500, 500, 10);
    stepBodies([a], -1, 500, 500, 10);
    expect(a.centerX).toBe(100);
  });
});

describe('stepRoam (drift, no pairwise collision)', () => {
  it('moves bodies without swapping velocity or separating overlaps', () => {
    const a = mkBody({ centerX: 100, centerY: 100, velocityX: 20, velocityY: 0 });
    const b = mkBody({ centerX: 110, centerY: 100, velocityX: -10, velocityY: 0 });
    stepRoam([a, b], 0.05, 500, 500, 10);
    // Same velocities as before — they pass straight through each other.
    expect(a.velocityX).toBe(20);
    expect(b.velocityX).toBe(-10);
    expect(a.centerX).toBeCloseTo(101);
    expect(b.centerX).toBeCloseTo(109.5);
  });

  it('still bounces off the walls', () => {
    const a = mkBody({ centerX: 495, centerY: 250, velocityX: 200, velocityY: 0 });
    stepRoam([a], 0.1, 500, 500, 10);
    expect(a.velocityX).toBeLessThan(0);
    expect(a.centerX).toBeLessThanOrEqual(490);
  });
});

describe('stepTicker (horizontal marquee wrap)', () => {
  it('wraps a right-moving body back onto the left side', () => {
    const a = mkBody({ centerX: 490, width: 40, velocityX: 100 });
    // 0.5s → x = 540; right edge 520 > 510 → wrap by track (520) → 20
    stepTicker([a], 0.5, 500, 1, 10);
    expect(a.centerX).toBeCloseTo(20);
  });

  it('wraps a left-moving body back onto the right side', () => {
    const a = mkBody({ centerX: 10, width: 40, velocityX: -100 });
    // left edge -20 < -10 → wrap by track (520) → 480
    stepTicker([a], 0.5, 500, -1, 10);
    expect(a.centerX).toBeCloseTo(480);
  });
});

describe('isTickerMotion', () => {
  it('is true only for the ticker modes', () => {
    expect(isTickerMotion('ticker-left')).toBe(true);
    expect(isTickerMotion('ticker-right')).toBe(true);
    expect(isTickerMotion('drift')).toBe(false);
    expect(isTickerMotion('roam')).toBe(false);
    expect(isTickerMotion('static')).toBe(false);
  });
});
