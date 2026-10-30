import { Position } from './position';
import { Searcher, type SearchResult } from './search';

export interface BotLevel {
  level: number;
  name: string;
  blurb: string;
  /** Search depth in plies. */
  depth: number;
  /** Time cap in ms. */
  timeMs: number;
  /** Pick randomly among moves within this many centipawns of the best (0 = always best). */
  margin: number;
  /** Chance of playing a random legal move instead. */
  blunder: number;
}

export const BOT_LEVELS: readonly BotLevel[] = [
  { level: 1, name: 'Newcomer', blurb: 'Just learned the moves. Blunders often.', depth: 1, timeMs: 400, margin: 350, blunder: 0.3 },
  { level: 2, name: 'Beginner', blurb: 'Grabs free pieces, misses a lot.', depth: 2, timeMs: 500, margin: 180, blunder: 0.12 },
  { level: 3, name: 'Casual', blurb: 'Sees simple threats.', depth: 2, timeMs: 600, margin: 90, blunder: 0.05 },
  { level: 4, name: 'Improver', blurb: 'Rarely hangs pieces.', depth: 3, timeMs: 800, margin: 45, blunder: 0.02 },
  { level: 5, name: 'Club player', blurb: 'Solid tactics, few gifts.', depth: 4, timeMs: 900, margin: 15, blunder: 0 },
  { level: 6, name: 'Strong', blurb: 'Calculates several moves ahead.', depth: 6, timeMs: 1500, margin: 0, blunder: 0 },
  { level: 7, name: 'Expert', blurb: 'Thinks hard. Punishes mistakes.', depth: 64, timeMs: 2500, margin: 0, blunder: 0 },
  { level: 8, name: 'Maximum', blurb: 'Full strength of the engine.', depth: 64, timeMs: 5000, margin: 0, blunder: 0 },
];

/** Build a position from a start FEN plus UCI moves (keeps history for repetition detection). */
export function positionFrom(fen: string, moves: readonly string[] = []): Position {
  const pos = new Position(fen);
  for (const uci of moves) {
    const m = pos.parseUci(uci);
    if (m === null) throw new Error(`Illegal move ${uci}`);
    pos.make(m);
  }
  return pos;
}

/** Choose a move for the bot at a given level. `rng` is injectable for tests. */
export function chooseBotMove(
  fen: string,
  moves: readonly string[],
  levelNumber: number,
  rng: () => number = Math.random,
): { move: string | null; result: SearchResult | null } {
  const level = BOT_LEVELS[Math.max(0, Math.min(BOT_LEVELS.length - 1, levelNumber - 1))];
  const pos = positionFrom(fen, moves);
  const legal = pos.legalMoves();
  if (legal.length === 0) return { move: null, result: null };

  if (level.margin === 0) {
    const result = new Searcher(pos).search({ depth: level.depth, timeMs: level.timeMs });
    return { move: result.move, result };
  }

  const searcher = new Searcher(pos);
  const scored = searcher.scoreRootMoves(level.depth);
  if (rng() < level.blunder) {
    const pick = scored[Math.floor(rng() * scored.length)];
    return { move: pick.move, result: null };
  }
  const best = scored[0].score;
  const candidates = scored.filter((s) => s.score >= best - level.margin);
  // Prefer better moves: weight decays with distance from the best.
  const weights = candidates.map((c) => Math.exp(-(best - c.score) / Math.max(1, level.margin / 2)));
  let r = rng() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r <= 0) return { move: candidates[i].move, result: null };
  }
  return { move: candidates[0].move, result: null };
}
