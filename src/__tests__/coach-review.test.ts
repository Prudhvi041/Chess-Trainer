import { describe, expect, it } from 'vitest';
import { analyzeGame } from '../engine/analyze';
import { openingHabits, reviewGame, winChance } from '../coach/review';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const run = (moves: string[], user: 'w' | 'b') =>
  reviewGame(START, moves, analyzeGame(START, moves, { timeMs: 400, depth: 5 }), user);

describe('game review', () => {
  it('win chance is symmetric and bounded', () => {
    expect(winChance(0)).toBeCloseTo(50);
    expect(winChance(300) + winChance(-300)).toBeCloseTo(100);
    expect(winChance(29990)).toBeGreaterThan(99);
  });

  it("flags falling for Scholar's Mate as allowing checkmate", () => {
    const moves = ['e2e4', 'e7e5', 'f1c4', 'b8c6', 'd1h5', 'g8f6', 'h5f7'];
    const r = run(moves, 'b');
    const nf6 = r.moves[5];
    expect(nf6.san).toBe('Nf6');
    expect(nf6.cls).toBe('blunder');
    expect(nf6.themes).toContain('mate-allowed');
    expect(nf6.themes).not.toContain('opening'); // the tactic explains it; no double counting
    expect(nf6.explanation).toMatch(/checkmate/i);
    expect(r.moves[6].san).toBe('Qxf7#');
    expect(r.userThemes['mate-allowed']).toBe(1);
    expect(r.accuracy.b).toBeLessThan(r.accuracy.w);
  });

  it('flags a hanging knight', () => {
    // 1.e4 e5 2.Nf3 Nc6 3.Ng5?? hangs nothing... use 3.Nh4?? no; play 2...Nf6 3.Nxe5 Ng4?? leaving knight to Qxg4
    const moves = ['e2e4', 'e7e5', 'g1f3', 'g8f6', 'f3e5', 'f6g4'];
    const r = run(moves, 'b');
    const ng4 = r.moves[5];
    expect(ng4.san).toBe('Ng4');
    expect(['mistake', 'blunder']).toContain(ng4.cls);
    expect(ng4.themes).toContain('hanging');
    expect(ng4.explanation).toMatch(/knight on g4 can be taken/);
  });

  it('notices missing a free piece', () => {
    // 1.e4 d6 2.Qg4?? hangs the queen to …Bxg4, but Black plays 2…Nc6
    const moves = ['e2e4', 'd7d6', 'd1g4', 'b8c6'];
    const r = run(moves, 'b');
    expect(r.moves[3].cls).toBe('blunder');
    expect(r.moves[3].themes).toContain('missed-capture');
    expect(r.moves[3].bestSan).toBe('Bxg4');
    expect(r.moves[3].explanation).toMatch(/won a queen with Bxg4/);
    // and White's 2.Qg4 itself is flagged as hanging the queen
    expect(r.moves[2].themes).toContain('hanging');
  });

  it('files motif-less early mistakes under opening play', () => {
    // 1.f3 e5 2.g4?? is mate-allowing (tactical); 1.a4 e5 2.Ra3 is merely poor
    const r = run(['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'f8c5', 'h2h4', 'h7h5', 'h1h3', 'g8f6', 'h3g3'], 'w');
    for (const m of r.moves.filter((x) => x.color === 'w' && (x.cls === 'mistake' || x.cls === 'blunder'))) {
      expect(m.themes.length).toBeGreaterThan(0);
      expect(m.themes).not.toContain('calculation');
    }
  });

  it('detects opening habits', () => {
    const habits = openingHabits(START, ['e2e4', 'e7e5', 'd1h5', 'b8c6', 'h5f3', 'g8f6', 'f3g3', 'f8c5', 'b1a3', 'd7d6'], 'w');
    expect(habits.join(' ')).toMatch(/queen/);
    expect(habits.join(' ')).toMatch(/edge/);
    expect(habits.join(' ')).toMatch(/same piece/);
  });
});
