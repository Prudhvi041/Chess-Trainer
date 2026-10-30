import { positionFrom } from './levels';
import type { PositionAnalysis } from './protocol';
import { Searcher } from './search';

/**
 * Analyse every position of a game: index i is the position *before* move i
 * (index moves.length is the final position).
 */
export function analyzeGame(
  fen: string,
  moves: readonly string[],
  opts: { timeMs: number; depth: number },
  onProgress?: (done: number, total: number) => void,
): PositionAnalysis[] {
  const out: PositionAnalysis[] = [];
  const total = moves.length + 1;
  for (let i = 0; i <= moves.length; i++) {
    const pos = positionFrom(fen, moves.slice(0, i));
    const r = new Searcher(pos).search({ timeMs: opts.timeMs, depth: opts.depth });
    out.push({ score: r.score, bestMove: r.move, pv: r.pv.slice(0, 6), depth: r.depth });
    onProgress?.(i + 1, total);
  }
  return out;
}
