import { describe, it, expect } from 'vitest';
import { COLORS, BACKGROUNDS, NAVBAR_BACKGROUNDS } from './colors.utils';
import type { Colors, ObjColors } from '../models/colors.model';

const expectedColorKeys: Colors[] = [
  'sky',
  'yellow',
  'green',
  'red',
  'violet',
  'gray',
  'success',
  'primary',
  'danger',
  'light',
  'info',
];

// ponytail: each legacy palette name (sky, yellow, etc.) must now point to a
// semantic color token in the class map. This is the explicit guarantee from
// the design doc: "sky key stays — VALUES point to semantic tokens now".
describe('colors.utils — semantic token mappings (Visual Redesign)', () => {
  describe('COLORS (button / board-card variant map)', () => {
    it('exposes every Colors key the model defines', () => {
      expectedColorKeys.forEach((key) => {
        expect(COLORS[key], `missing key: ${key}`).toBeDefined();
      });
    });

    it('legacy "sky" variant uses pastel blue', () => {
      expect(COLORS.sky['bg-primary-200']).toBe(true);
    });

    it('legacy "green" variant uses pastel green', () => {
      expect(COLORS.green['bg-success-200']).toBe(true);
    });

    it('legacy "red" variant uses pastel red', () => {
      expect(COLORS.red['bg-danger-200']).toBe(true);
    });

    it('legacy "yellow" variant uses pastel yellow', () => {
      expect(COLORS.yellow['bg-warning-100']).toBe(true);
    });

    it('semantic "primary" variant uses pastel', () => {
      expect(COLORS.primary['bg-primary-200']).toBe(true);
    });

    it('semantic "success" variant uses pastel', () => {
      expect(COLORS.success['bg-success-200']).toBe(true);
    });

    it('semantic "danger" variant uses pastel', () => {
      expect(COLORS.danger['bg-danger-200']).toBe(true);
    });

    it('semantic "info" variant uses pastel', () => {
      expect(COLORS.info['bg-info-200']).toBe(true);
    });

    it('every pastel variant uses dark text for legibility', () => {
      const lightText: Colors[] = [];
      const darkText: Colors[] = ['sky', 'violet', 'gray', 'primary', 'info'];
      const coloredText: Colors[] = ['yellow', 'green', 'red', 'success', 'danger'];
      darkText.forEach((key) => {
        expect(COLORS[key]['text-gray-900'], `${key} should be text-gray-900`).toBe(true);
      });
      const colorMap: Record<string, string> = {
        yellow: 'text-warning-800',
        green: 'text-success-800',
        red: 'text-danger-800',
        success: 'text-success-800',
        danger: 'text-danger-800',
      };
      coloredText.forEach((key) => {
        expect(COLORS[key][colorMap[key]], `${key} should be ${colorMap[key]}`).toBe(true);
      });
    });
  });

  describe('BACKGROUNDS (full-bleed board backgrounds)', () => {
    it('exposes every Colors key', () => {
      expectedColorKeys.forEach((key) => {
        expect(BACKGROUNDS[key], `missing key: ${key}`).toBeDefined();
      });
    });

    it('legacy "sky" background uses pastel blue', () => {
      expect(BACKGROUNDS.sky['bg-primary-200']).toBe(true);
    });

    it('legacy "green" background uses pastel green', () => {
      expect(BACKGROUNDS.green['bg-success-200']).toBe(true);
    });

    it('legacy "red" background uses pastel red', () => {
      expect(BACKGROUNDS.red['bg-danger-200']).toBe(true);
    });

    it('legacy "yellow" background uses pastel yellow', () => {
      expect(BACKGROUNDS.yellow['bg-warning-100']).toBe(true);
    });

    it('semantic "primary" background uses pastel', () => {
      expect(BACKGROUNDS.primary['bg-primary-200']).toBe(true);
    });

    it('semantic "success" background uses pastel', () => {
      expect(BACKGROUNDS.success['bg-success-200']).toBe(true);
    });
  });

  describe('NAVBAR_BACKGROUNDS', () => {
    it('exposes every Colors key', () => {
      expectedColorKeys.forEach((key) => {
        expect(NAVBAR_BACKGROUNDS[key], `missing key: ${key}`).toBeDefined();
      });
    });

    it('all navbar backgrounds use warm dark gray', () => {
      expectedColorKeys.forEach((key) => {
        expect(NAVBAR_BACKGROUNDS[key]['bg-gray-800'], `${key} should be bg-gray-800`).toBe(true);
      });
    });
  });

  describe('structural invariants shared across all maps', () => {
    const maps: Array<[string, ObjColors]> = [
      ['COLORS', COLORS],
      ['BACKGROUNDS', BACKGROUNDS],
      ['NAVBAR_BACKGROUNDS', NAVBAR_BACKGROUNDS],
    ];

    it.each(maps)('%s has at least one Tailwind class per entry', (_name, map) => {
      expectedColorKeys.forEach((key) => {
        const classNames = Object.keys(map[key]);
        expect(classNames.length, `${key} has no classes`).toBeGreaterThan(0);
      });
    });
  });
});
