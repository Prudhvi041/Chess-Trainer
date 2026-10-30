import { describe, expect, it } from 'vitest';
import {
  ALL_SQUARES,
  displaySquares,
  edgeLabels,
  formatSquare,
  isLightSquare,
  nextOrientation,
  ORIENTATIONS,
  randomSquare,
  squareAt,
  squareFromId,
} from '../lib/coords';

describe('coords', () => {
  it('generates 64 unique squares', () => {
    expect(ALL_SQUARES).toHaveLength(64);
    expect(new Set(ALL_SQUARES.map((s) => s.id)).size).toBe(64);
  });

  it('colors a1 dark and h1 light', () => {
    expect(isLightSquare(squareFromId('a1')!)).toBe(false);
    expect(isLightSquare(squareFromId('h1')!)).toBe(true);
    expect(isLightSquare(squareFromId('d4')!)).toBe(false);
    expect(isLightSquare(squareFromId('e4')!)).toBe(true);
  });

  it('formats as uppercase', () => {
    expect(formatSquare(squareFromId('e4')!)).toBe('E4');
  });

  it('maps standard orientation correctly', () => {
    expect(squareAt(0, 0, 0).id).toBe('a8');
    expect(squareAt(7, 0, 0).id).toBe('a1');
    expect(squareAt(7, 7, 0).id).toBe('h1');
    expect(squareAt(0, 0, 180).id).toBe('h1');
    expect(squareAt(7, 7, 180).id).toBe('a8');
  });

  it('every orientation shows each square exactly once and keeps colors alternating', () => {
    for (const o of ORIENTATIONS) {
      const squares = displaySquares(o);
      expect(new Set(squares.map((s) => s.id)).size).toBe(64);
      for (let i = 0; i < 63; i++) {
        if ((i + 1) % 8 === 0) continue;
        expect(isLightSquare(squares[i])).not.toBe(isLightSquare(squares[i + 1]));
      }
    }
  });

  it('edge labels match the squares they sit beside', () => {
    for (const o of ORIENTATIONS) {
      const { rows, cols } = edgeLabels(o);
      for (let r = 0; r < 8; r++) {
        const row = Array.from({ length: 8 }, (_, c) => squareAt(r, c, o).id.toUpperCase());
        expect(row.every((id) => id.includes(rows[r]))).toBe(true);
      }
      for (let c = 0; c < 8; c++) {
        const col = Array.from({ length: 8 }, (_, r) => squareAt(r, c, o).id.toUpperCase());
        expect(col.every((id) => id.includes(cols[c]))).toBe(true);
      }
    }
  });

  it('randomSquare never repeats the excluded square', () => {
    const e4 = squareFromId('e4')!;
    for (let i = 0; i < 500; i++) expect(randomSquare(e4).id).not.toBe('e4');
  });

  it('nextOrientation always changes', () => {
    for (const o of ORIENTATIONS) for (const seed of [0, 0.5, 0.99]) expect(nextOrientation(o, () => seed)).not.toBe(o);
  });
});
