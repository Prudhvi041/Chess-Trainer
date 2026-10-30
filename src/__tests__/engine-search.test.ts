import { describe, expect, it } from 'vitest';
import { Chess } from 'chess.js';
import { chooseBotMove, positionFrom } from '../engine/levels';
import { clearTranspositionTable, isMateScore, mateIn, Searcher, searchFen } from '../engine/search';

describe('engine search', () => {
  it('finds mate in 1 (back rank)', () => {
    const r = searchFen('6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1', { depth: 4 });
    expect(r.move).toBe('a1a8');
    expect(isMateScore(r.score) && mateIn(r.score)).toBe(1);
  });

  it('finds the ladder mate in 2', () => {
    const r = searchFen('8/4k3/R7/8/8/8/8/1R5K w - - 0 1', { depth: 6 });
    expect(mateIn(r.score)).toBe(2);
    expect(r.move).toBe('b1b7');
    // With the king on d7 there is no forced mate in 2 (…Kc8 and …Kxb7 escapes).
    expect(mateIn(searchFen('8/3k4/R7/8/8/8/8/1R5K w - - 0 1', { depth: 6 }).score)).toBeGreaterThan(2);
  });

  it('takes a hanging queen', () => {
    const r = searchFen('4k3/8/8/3q4/8/8/3R4/4K3 w - - 0 1', { depth: 4 });
    expect(r.move).toBe('d2d5');
  });

  it('wins material with a knight fork', () => {
    const r = searchFen('r3k3/8/8/1N6/8/8/8/6K1 w - - 0 1', { depth: 5 });
    expect(r.move).toBe('b5c7');
  });

  it('does not stalemate when mate is available', () => {
    const r = searchFen('k7/8/1K6/8/8/8/8/2Q5 w - - 0 1', { depth: 4 });
    const g = new Chess('k7/8/1K6/8/8/8/8/2Q5 w - - 0 1');
    g.move({ from: r.move!.slice(0, 2), to: r.move!.slice(2, 4) });
    expect(g.isCheckmate()).toBe(true);
  });

  it('reports mate against the side to move', () => {
    const r = searchFen('R5k1/5ppp/8/8/8/8/8/6K1 b - - 0 1', { depth: 3 });
    expect(r.move).toBeNull();
    expect(r.score).toBeLessThan(-29000);
  });

  it('respects the time limit', () => {
    const t = Date.now();
    searchFen('r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3', { timeMs: 300 });
    expect(Date.now() - t).toBeLessThan(900);
  });

  it('treats repetition as a draw', () => {
    const start = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const pos = positionFrom(start, ['g1f3', 'g8f6', 'f3g1', 'f6g8', 'g1f3', 'g8f6', 'f3g1']);
    pos.make(pos.parseUci('f6g8')!);
    expect(pos.isRepetition()).toBe(true);
  });

  it('every level returns a legal move', () => {
    const start = 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3';
    for (let level = 1; level <= 6; level++) {
      const { move } = chooseBotMove(start, [], level, () => 0.5);
      const g = new Chess(start);
      expect(() => g.move({ from: move!.slice(0, 2), to: move!.slice(2, 4) })).not.toThrow();
    }
  });

  it('searches quickly enough for play', () => {
    clearTranspositionTable();
    const r = new Searcher(positionFrom('r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3')).search({ depth: 5 });
    expect(r.depth).toBe(5);
    console.log(`depth 5: ${r.nodes} nodes, best ${r.move}, score ${r.score}, pv ${r.pv.join(' ')}`);
  });
});
