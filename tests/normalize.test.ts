import { describe, expect, it } from 'vitest';
import { normalizeItems } from '../src/core/physics';
import type { ContentItem } from '../src';

describe('normalizeItems', () => {
  it('maps plain strings to text content items', () => {
    expect(normalizeItems(['A', 'B', 'C'])).toEqual([
      { kind: 'text', value: 'A' },
      { kind: 'text', value: 'B' },
      { kind: 'text', value: 'C' },
    ]);
  });

  it('passes through already-shaped content items', () => {
    const input: ContentItem[] = [
      { kind: 'emoji', value: '🌊' },
      { kind: 'shape', value: 'star', radius: 30 },
      { kind: 'path', value: 'M0 0 L10 10' },
    ];
    expect(normalizeItems(input)).toEqual(input);
  });

  it('drops empty strings and invalid values', () => {
    const result = normalizeItems([
      '',
      { kind: 'text', value: '' },
      42 as unknown as ContentItem,
      { kind: 'shape', value: 'circle' },
    ]);
    expect(result).toEqual([{ kind: 'shape', value: 'circle' }]);
  });

  it('returns [] for missing / non-array input', () => {
    expect(normalizeItems(undefined)).toEqual([]);
    expect(normalizeItems([])).toEqual([]);
  });

  it('omits an undefined shape radius', () => {
    const result = normalizeItems([{ kind: 'shape', value: 'square' }]);
    expect(result).toEqual([{ kind: 'shape', value: 'square' }]);
  });
});
