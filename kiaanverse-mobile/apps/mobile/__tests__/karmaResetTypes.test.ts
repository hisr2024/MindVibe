/**
 * Karma Reset — pure data + helpers in `components/karma-reset/types.ts`.
 *
 * Guards the ritual catalog (KARMA_CATEGORIES, KARMA_WEIGHTS,
 * DHARMIC_QUALITIES, CATEGORY_COLORS) against accidental shape drift, and
 * covers `hexToRgbTriplet` — the helper that feeds every gradient/border
 * color in the ritual UI.
 */

import {
  CATEGORY_COLORS,
  DHARMIC_QUALITIES,
  KARMA_CATEGORIES,
  KARMA_WEIGHTS,
  hexToRgbTriplet,
  type KarmaCategory,
} from '../components/karma-reset/types';

const ALL_CATEGORY_IDS: readonly KarmaCategory[] = [
  'action',
  'speech',
  'thought',
  'reaction',
  'avoidance',
  'intention',
];

describe('KARMA_CATEGORIES catalog', () => {
  it('has exactly the 6 canonical categories', () => {
    expect(KARMA_CATEGORIES).toHaveLength(6);
    const ids = KARMA_CATEGORIES.map((c) => c.id).sort();
    expect(ids).toEqual([...ALL_CATEGORY_IDS].sort());
  });

  it('each entry has the required fields with non-empty strings', () => {
    for (const cat of KARMA_CATEGORIES) {
      expect(typeof cat.id).toBe('string');
      expect(cat.id.length).toBeGreaterThan(0);
      expect(typeof cat.sanskrit).toBe('string');
      expect(cat.sanskrit.length).toBeGreaterThan(0);
      expect(typeof cat.label).toBe('string');
      expect(cat.label.length).toBeGreaterThan(0);
      expect(typeof cat.color).toBe('string');
      expect(cat.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('all ids are unique', () => {
    const ids = KARMA_CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('KARMA_WEIGHTS catalog', () => {
  it('has exactly the 4 weights in ascending severity', () => {
    expect(KARMA_WEIGHTS).toHaveLength(4);
    const ids = KARMA_WEIGHTS.map((w) => w.id);
    expect(ids).toEqual(['light', 'moderate', 'heavy', 'very_heavy']);
  });

  it('each weight has required non-empty fields + ascending flameSize', () => {
    let lastFlame = -Infinity;
    for (const w of KARMA_WEIGHTS) {
      expect(w.id).toBeTruthy();
      expect(w.label).toBeTruthy();
      expect(w.sanskrit).toBeTruthy();
      expect(typeof w.flameSize).toBe('number');
      expect(typeof w.reflectionDepth).toBe('number');
      // Flame visually grows with severity.
      expect(w.flameSize).toBeGreaterThan(lastFlame);
      lastFlame = w.flameSize;
    }
  });
});

describe('CATEGORY_COLORS map', () => {
  it('covers every category id with a hex color', () => {
    for (const id of ALL_CATEGORY_IDS) {
      expect(CATEGORY_COLORS[id]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('matches the color field on KARMA_CATEGORIES', () => {
    for (const cat of KARMA_CATEGORIES) {
      expect(CATEGORY_COLORS[cat.id]).toBe(cat.color);
    }
  });
});

describe('DHARMIC_QUALITIES catalog', () => {
  it('has at least one quality with required fields', () => {
    expect(DHARMIC_QUALITIES.length).toBeGreaterThan(0);
    for (const q of DHARMIC_QUALITIES) {
      expect(q.id).toBeTruthy();
      expect(q.sanskrit).toBeTruthy();
      expect(q.label).toBeTruthy();
      expect(q.description).toBeTruthy();
      expect(q.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('ids are unique', () => {
    const ids = DHARMIC_QUALITIES.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('hexToRgbTriplet', () => {
  it('converts a full hex with # prefix', () => {
    expect(hexToRgbTriplet('#D4A017')).toBe('212,160,23');
  });

  it('converts a full hex without # prefix', () => {
    expect(hexToRgbTriplet('D4A017')).toBe('212,160,23');
  });

  it('handles pure black and pure white', () => {
    expect(hexToRgbTriplet('#000000')).toBe('0,0,0');
    expect(hexToRgbTriplet('#FFFFFF')).toBe('255,255,255');
  });

  it('is case-insensitive', () => {
    expect(hexToRgbTriplet('#abcdef')).toBe(hexToRgbTriplet('#ABCDEF'));
  });
});
