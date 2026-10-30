import { describe, expect, it } from 'vitest';
import { parsePuzzle } from '../coach/lichess';

describe('lichess puzzle parsing', () => {
  it('sets up the position from the PGN and the solver to move', () => {
    const p = parsePuzzle({
      game: { pgn: 'e4 e5 Bc4 Nc6 Qh5 Nf6' },
      puzzle: { id: 'abc12', rating: 900, themes: ['mateIn1', 'short'], solution: ['h5f7'], initialPly: 5 },
    });
    expect(p.userColor).toBe('w');
    expect(p.lastMove).toEqual(['g8', 'f6']);
    expect(p.fen.startsWith('r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w')).toBe(true);
  });

  it('handles numbered PGN and a PGN longer than the puzzle start', () => {
    const p = parsePuzzle({
      game: { pgn: '1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7# 1-0' },
      puzzle: { id: 'x', rating: 900, themes: [], solution: ['h5f7'], initialPly: 5 },
    });
    expect(p.userColor).toBe('w');
    expect(p.solution[0]).toBe('h5f7');
  });
});
