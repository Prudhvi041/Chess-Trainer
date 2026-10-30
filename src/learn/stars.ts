import { createGame, legalMovesFrom, passTurnTo, tryMove } from './chess';

/**
 * Breadth-first search for the fewest moves that collect every star.
 * Only the side to move ever moves. Returns null if unsolvable within `maxDepth`.
 */
export function solveStars(fen: string, stars: readonly string[], maxDepth = 12): number | null {
  const color = fen.split(' ')[1] === 'b' ? 'b' : 'w';
  type Node = { fen: string; left: string[]; depth: number };
  const key = (n: Node) => `${n.fen.split(' ')[0]}|${n.left.join(',')}`;
  const queue: Node[] = [{ fen, left: [...stars].sort(), depth: 0 }];
  const seen = new Set([key(queue[0])]);

  while (queue.length) {
    const node = queue.shift()!;
    if (node.left.length === 0) return node.depth;
    if (node.depth >= maxDepth) continue;
    const game = createGame(node.fen);
    const froms = new Set(game.moves({ verbose: true }).map((m) => m.from));
    for (const from of froms) {
      for (const move of legalMovesFrom(game, from)) {
        const g = createGame(node.fen);
        if (!tryMove(g, `${move.from}${move.to}${move.promotion ? 'q' : ''}`)) continue;
        passTurnTo(g, color);
        const next: Node = { fen: g.fen(), left: node.left.filter((s) => s !== move.to), depth: node.depth + 1 };
        const k = key(next);
        if (!seen.has(k)) {
          seen.add(k);
          queue.push(next);
        }
      }
    }
  }
  return null;
}
