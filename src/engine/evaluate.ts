import { BISHOP, BLACK, KING, KNIGHT, PAWN, pieceColor, pieceType, Position, QUEEN, ROOK, WHITE } from './position';

/** Centipawn values, index = piece type. */
export const VALUE = [0, 100, 320, 330, 500, 900, 0];

/*
 * Piece-square tables (from White's point of view, rank 8 first, a→h),
 * based on Tomasz Michniewski's "Simplified Evaluation Function".
 */
// prettier-ignore
const PST_PAWN = [
   0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0,
];
// prettier-ignore
const PST_KNIGHT = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50,
];
// prettier-ignore
const PST_BISHOP = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20,
];
// prettier-ignore
const PST_ROOK = [
   0,  0,  0,  0,  0,  0,  0,  0,
   5, 10, 10, 10, 10, 10, 10,  5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
   0,  0,  0,  5,  5,  0,  0,  0,
];
// prettier-ignore
const PST_QUEEN = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
   -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20,
];
// prettier-ignore
const PST_KING_MG = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
   20, 20,  0,  0,  0,  0, 20, 20,
   20, 30, 10,  0,  0, 10, 30, 20,
];
// prettier-ignore
const PST_KING_EG = [
  -50,-40,-30,-20,-20,-30,-40,-50,
  -30,-20,-10,  0,  0,-10,-20,-30,
  -30,-10, 20, 30, 30, 20,-10,-30,
  -30,-10, 30, 40, 40, 30,-10,-30,
  -30,-10, 30, 40, 40, 30,-10,-30,
  -30,-10, 20, 30, 30, 20,-10,-30,
  -30,-30,  0,  0,  0,  0,-30,-30,
  -50,-30,-30,-30,-30,-30,-30,-50,
];

const PST = [[], PST_PAWN, PST_KNIGHT, PST_BISHOP, PST_ROOK, PST_QUEEN];
const PHASE_WEIGHT = [0, 0, 1, 1, 2, 4, 0];
const TOTAL_PHASE = 24;

/** Index into the visual (rank-8-first) tables for a 0x88 square and color. */
const pstIndex = (sq: number, color: number) => {
  const file = sq & 7;
  const rank = sq >> 4;
  return color === WHITE ? (7 - rank) * 8 + file : rank * 8 + file;
};

/** Static evaluation in centipawns from the side to move's point of view. */
export function evaluate(pos: Position): number {
  const b = pos.board;
  let mg = 0;
  let eg = 0;
  let phase = 0;
  const bishops = [0, 0];
  const pawnFiles = [new Int8Array(8), new Int8Array(8)];

  for (let sq = 0; sq < 128; sq++) {
    if (sq & 0x88) {
      sq += 7;
      continue;
    }
    const p = b[sq];
    if (!p) continue;
    const color = pieceColor(p);
    const type = pieceType(p);
    const sign = color === WHITE ? 1 : -1;
    const idx = pstIndex(sq, color);
    phase += PHASE_WEIGHT[type];
    if (type === KING) {
      mg += sign * PST_KING_MG[idx];
      eg += sign * PST_KING_EG[idx];
      continue;
    }
    const v = VALUE[type] + PST[type][idx];
    mg += sign * v;
    eg += sign * v;
    if (type === BISHOP) bishops[color]++;
    if (type === PAWN) pawnFiles[color][sq & 7]++;
  }

  // bishop pair
  if (bishops[WHITE] >= 2) (mg += 30), (eg += 40);
  if (bishops[BLACK] >= 2) (mg -= 30), (eg -= 40);

  // doubled / isolated pawns
  for (const color of [WHITE, BLACK]) {
    const sign = color === WHITE ? 1 : -1;
    const files = pawnFiles[color];
    for (let f = 0; f < 8; f++) {
      if (files[f] > 1) (mg -= sign * 12 * (files[f] - 1)), (eg -= sign * 20 * (files[f] - 1));
      if (files[f] && !(f > 0 && files[f - 1]) && !(f < 7 && files[f + 1])) (mg -= sign * 10), (eg -= sign * 15);
    }
  }

  const ph = Math.min(phase, TOTAL_PHASE);
  const score = Math.round((mg * ph + eg * (TOTAL_PHASE - ph)) / TOTAL_PHASE);
  return (pos.side === WHITE ? score : -score) + 10; // small tempo bonus
}

/** Non-pawn material of one side (used for endgame detection). */
export function nonPawnMaterial(pos: Position, color: number): number {
  let total = 0;
  for (let sq = 0; sq < 128; sq++) {
    if (sq & 0x88) continue;
    const p = pos.board[sq];
    if (p && pieceColor(p) === color) {
      const t = pieceType(p);
      if (t === KNIGHT || t === BISHOP || t === ROOK || t === QUEEN) total += VALUE[t];
    }
  }
  return total;
}
