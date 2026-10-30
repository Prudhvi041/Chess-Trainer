import { Chess } from 'chess.js';

/** A puzzle from the free Lichess public API (puzzle data is CC0 public domain). */
export interface LichessPuzzle {
  id: string;
  rating: number;
  themes: string[];
  /** Position the solver starts from (solver to move). */
  fen: string;
  /** UCI moves alternating solver / opponent, starting with the solver. */
  solution: string[];
  userColor: 'w' | 'b';
  /** The opponent's move that set up the puzzle. */
  lastMove: [string, string] | null;
}

export type PuzzleDifficulty = 'easiest' | 'easier' | 'normal' | 'harder' | 'hardest';

const API = 'https://lichess.org/api/puzzle/next';

interface ApiResponse {
  game: { pgn: string };
  puzzle: { id: string; rating: number; themes: string[]; solution: string[]; initialPly: number };
}

/** Rebuild the puzzle start position from the API's game PGN. */
export function parsePuzzle(data: ApiResponse): LichessPuzzle {
  const tokens = data.game.pgn
    .replace(/\{[^}]*\}/g, ' ')
    .split(/\s+/)
    .map((t) => t.replace(/^\d+\.+/, ''))
    .filter((t) => t && !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(t));
  const { solution, initialPly } = data.puzzle;
  // The PGN normally ends at the puzzle start; fall back to initialPly if it runs longer.
  const candidates = [...new Set([tokens.length, initialPly + 1, initialPly])].filter((n) => n > 0 && n <= tokens.length);
  for (const count of candidates) {
    const g = new Chess();
    try {
      for (const san of tokens.slice(0, count)) g.move(san);
      const probe = new Chess(g.fen());
      probe.move({ from: solution[0].slice(0, 2), to: solution[0].slice(2, 4), promotion: solution[0][4] });
      const last = g.history({ verbose: true }).at(-1);
      return {
        id: data.puzzle.id,
        rating: data.puzzle.rating,
        themes: data.puzzle.themes,
        fen: g.fen(),
        solution,
        userColor: g.turn(),
        lastMove: last ? [last.from, last.to] : null,
      };
    } catch {
      /* try next candidate */
    }
  }
  throw new Error('Could not set up this puzzle');
}

export async function fetchPuzzle(angle: string, difficulty: PuzzleDifficulty, signal?: AbortSignal): Promise<LichessPuzzle> {
  const url = `${API}?angle=${encodeURIComponent(angle)}&difficulty=${difficulty}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' }, signal });
  if (res.status === 429) throw new Error('Lichess asked us to slow down. Wait a minute and try again.');
  if (!res.ok) throw new Error(`Lichess returned ${res.status}`);
  return parsePuzzle((await res.json()) as ApiResponse);
}

export const PUZZLE_ANGLES: { angle: string; label: string }[] = [
  { angle: 'hangingPiece', label: 'Hanging pieces' },
  { angle: 'fork', label: 'Forks' },
  { angle: 'pin', label: 'Pins' },
  { angle: 'skewer', label: 'Skewers' },
  { angle: 'mateIn1', label: 'Mate in 1' },
  { angle: 'mateIn2', label: 'Mate in 2' },
  { angle: 'backRankMate', label: 'Back-rank mate' },
  { angle: 'opening', label: 'Opening' },
  { angle: 'middlegame', label: 'Middlegame' },
  { angle: 'endgame', label: 'Endgame' },
];
