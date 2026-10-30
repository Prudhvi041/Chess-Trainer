import { Chess, type Move, type Square as ChessSquare } from 'chess.js';
import type { PieceColor, PieceType } from '../components/chess/pieces';

/** Lesson boards may omit kings, so validation is always skipped. */
export const createGame = (fen: string) => new Chess(fen, { skipValidation: true });

export const EMPTY_FEN = '8/8/8/8/8/8/8/8 w - - 0 1';
export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export type PieceMap = Record<string, { type: PieceType; color: PieceColor }>;

export function piecesOf(game: Chess): PieceMap {
  const map: PieceMap = {};
  for (const row of game.board()) {
    for (const cell of row) if (cell) map[cell.square] = { type: cell.type, color: cell.color };
  }
  return map;
}

/** FEN after playing SAN moves from the start position (used to author opening lessons). */
export function fenAfter(sanMoves: string, from = START_FEN): string {
  const game = new Chess(from);
  for (const san of sanMoves.split(/\s+/).filter(Boolean)) game.move(san);
  return game.fen();
}

export const toUci = (m: Pick<Move, 'from' | 'to' | 'promotion'>) => `${m.from}${m.to}${m.promotion ?? ''}`;

export function legalMovesFrom(game: Chess, square: string): Move[] {
  return game.moves({ square: square as ChessSquare, verbose: true });
}

export function tryMove(game: Chess, uci: string): Move | null {
  try {
    return game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
  } catch {
    return null;
  }
}

/** Give the move back to `color` (star puzzles: Black never moves) and clear en-passant. */
export function passTurnTo(game: Chess, color: PieceColor): void {
  const parts = game.fen().split(' ');
  parts[1] = color;
  parts[3] = '-';
  game.load(parts.join(' '), { skipValidation: true });
}

/** Square of the king of the side to move, if it's in check. */
export function checkedKingSquare(game: Chess): string | null {
  if (!game.inCheck()) return null;
  const turn = game.turn();
  for (const row of game.board()) for (const c of row) if (c && c.type === 'k' && c.color === turn) return c.square;
  return null;
}

export const isPromotionMove = (game: Chess, from: string, to: string) =>
  legalMovesFrom(game, from).some((m) => m.to === to && m.promotion);
