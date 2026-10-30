import { Chess, type Color, type Move, type PieceSymbol, type Square } from 'chess.js';
import type { PositionAnalysis } from '../engine/protocol';
import { isMateScore, MATE } from '../engine/search';
import type { ThemeId } from './themes';

export type MoveClass = 'best' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';

export interface MoveReview {
  ply: number;
  uci: string;
  san: string;
  color: Color;
  cls: MoveClass;
  /** Win chance (0–100) for the mover before and after the move. */
  winBefore: number;
  winAfter: number;
  accuracy: number;
  bestMove: string | null;
  bestSan: string | null;
  /** Opponent's best reply after this move. */
  replyMove: string | null;
  replySan: string | null;
  themes: ThemeId[];
  explanation: string;
}

export interface GameReview {
  moves: MoveReview[];
  /** White-perspective evaluation (pawns, clamped ±10) for each position, for the graph. */
  evals: number[];
  accuracy: { w: number; b: number };
  counts: Record<Color, Record<MoveClass, number>>;
  /** Opening habits flagged for the user (plain-language). */
  habits: string[];
  /** Theme → number of user mistakes in this game (incl. habits under "opening"). */
  userThemes: Partial<Record<ThemeId, number>>;
}

const PIECE_VALUE: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
const PIECE_NAME: Record<PieceSymbol, string> = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };

/** Lichess-style conversion from centipawns to win chance (0–100). */
export function winChance(score: number): number {
  const cp = isMateScore(score) ? Math.sign(score) * 10000 : Math.max(-10000, Math.min(10000, score));
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
}

export function moveAccuracy(lossPct: number): number {
  return Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * lossPct) - 3.1669));
}

export function classify(lossPct: number): MoveClass {
  if (lossPct >= 15) return 'blunder';
  if (lossPct >= 10) return 'mistake';
  if (lossPct >= 5) return 'inaccuracy';
  return 'good';
}

const SEVERITY: Record<MoveClass, number> = { best: 0, good: 0, inaccuracy: 1, mistake: 2, blunder: 3 };
const worst = (a: MoveClass, b: MoveClass) => (SEVERITY[a] >= SEVERITY[b] ? a : b);

function safeMove(g: Chess, uci: string | null): Move | null {
  if (!uci) return null;
  try {
    return g.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
  } catch {
    return null;
  }
}

/** Valuable enemy targets (minor piece or better, or the king) attacked by the piece on `sq`. */
function forkTargets(g: Chess, sq: Square): Square[] {
  const piece = g.get(sq);
  if (!piece) return [];
  const targets: Square[] = [];
  for (const row of g.board()) {
    for (const cell of row) {
      if (!cell || cell.color === piece.color) continue;
      if (PIECE_VALUE[cell.type] < 3) continue;
      if (PIECE_VALUE[cell.type] <= PIECE_VALUE[piece.type] && cell.type !== 'k') {
        // only count a target if it's undefended or worth more than the forking piece
        if (g.attackers(cell.square, cell.color).length > 0) continue;
      }
      if (g.attackers(cell.square, piece.color).includes(sq)) targets.push(cell.square);
    }
  }
  return targets;
}

/** Does `move` (already played on g) win material outright: capture of an undefended or more valuable piece? */
function isWinningCapture(before: Chess, move: Move): boolean {
  if (!move.captured || PIECE_VALUE[move.captured] < 3) return false;
  if (PIECE_VALUE[move.captured] > PIECE_VALUE[move.piece]) return true;
  const after = new Chess(before.fen());
  after.move(move.san);
  return after.attackers(move.to, after.turn()).length === 0;
}

function isEndgame(g: Chess): boolean {
  let w = 0;
  let b = 0;
  for (const row of g.board())
    for (const c of row)
      if (c && c.type !== 'p' && c.type !== 'k') (c.color === 'w' ? (w += PIECE_VALUE[c.type]) : (b += PIECE_VALUE[c.type]));
  return w <= 13 && b <= 13 && w + b <= 22;
}

/**
 * Build a full review from engine analysis.
 * `analysis[i]` evaluates the position before move i (side to move's view); it has moves.length + 1 entries.
 */
export function reviewGame(
  startFen: string,
  moves: readonly string[],
  analysis: readonly PositionAnalysis[],
  userColor: Color,
): GameReview {
  const g = new Chess(startFen);
  const reviews: MoveReview[] = [];
  const evals: number[] = [];
  const counts: GameReview['counts'] = {
    w: { best: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
    b: { best: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
  };
  const userThemes: Partial<Record<ThemeId, number>> = {};
  const accSum = { w: 0, b: 0 };
  const accN = { w: 0, b: 0 };

  const whiteEval = (i: number) => {
    const a = analysis[i];
    const s = isMateScore(a.score) ? Math.sign(a.score) * 10 : Math.max(-10, Math.min(10, a.score / 100));
    // analysis is from side-to-move's view; position i has white to move iff i is even (from standard start)
    const sideToMove = new Chess(startFen).turn() === 'w' ? (i % 2 === 0 ? 'w' : 'b') : i % 2 === 0 ? 'b' : 'w';
    return sideToMove === 'w' ? s : -s;
  };

  for (let i = 0; i < moves.length; i++) {
    evals.push(whiteEval(i));
    const fenBefore = g.fen();
    const color = g.turn();
    const before = analysis[i];
    const afterRaw = analysis[i + 1];
    const played = safeMove(g, moves[i]);
    if (!played) break;

    // score after the move from the mover's view
    let afterScore: number;
    if (g.isCheckmate()) afterScore = MATE;
    else if (g.isDraw() || g.isStalemate()) afterScore = 0;
    else afterScore = -afterRaw.score;

    const winBefore = winChance(before.score);
    const winAfter = winChance(afterScore);
    const isBest = before.bestMove === moves[i];
    const loss = isBest ? 0 : Math.max(0, winBefore - winAfter);
    let cls: MoveClass = isBest ? 'best' : classify(loss);

    const themes: ThemeId[] = [];
    const beforeG = new Chess(fenBefore);
    const bestMv = before.bestMove ? safeMove(new Chess(fenBefore), before.bestMove) : null;
    const replyG = new Chess(g.fen());
    const replyMv = !g.isGameOver() ? safeMove(replyG, afterRaw.bestMove) : null;

    const missedMate = isMateScore(before.score) && before.score > 0 && !(isMateScore(afterScore) && afterScore > 0);
    const allowedMate = isMateScore(afterScore) && afterScore < 0 && !(isMateScore(before.score) && before.score < 0);
    if (missedMate) cls = worst(cls, 'mistake');
    if (allowedMate) cls = worst(cls, 'blunder');

    if (SEVERITY[cls] >= 2) {
      if (missedMate) themes.push('mate-missed');
      if (allowedMate) themes.push('mate-allowed');
      if (replyMv?.captured && !allowedMate) {
        const victimValue = PIECE_VALUE[replyMv.captured];
        const recapture = replyG.attackers(replyMv.to, color).length > 0;
        if (victimValue >= 3 && (!recapture || victimValue > PIECE_VALUE[replyMv.piece])) themes.push('hanging');
      }
      if (replyMv && !allowedMate && forkTargets(replyG, replyMv.to).length >= 2) themes.push('fork-allowed');
      if (bestMv && !missedMate) {
        const bestG = new Chess(fenBefore);
        bestG.move(bestMv.san);
        if (isWinningCapture(beforeG, bestMv) && played.to !== bestMv.to) themes.push('missed-capture');
        else if (forkTargets(bestG, bestMv.to).length >= 2) themes.push('fork-missed');
      }
      // No tactical motif found: file it under the phase of the game.
      if (themes.length === 0) themes.push(i < 20 ? 'opening' : isEndgame(beforeG) ? 'endgame' : 'calculation');
    }

    const accuracy = moveAccuracy(loss);
    accSum[color] += accuracy;
    accN[color]++;
    counts[color][cls]++;
    if (color === userColor) {
      for (const t of themes) userThemes[t] = (userThemes[t] ?? 0) + 1;
    }

    reviews.push({
      ply: i,
      uci: moves[i],
      san: played.san,
      color,
      cls,
      winBefore,
      winAfter,
      accuracy,
      bestMove: before.bestMove,
      bestSan: bestMv?.san ?? null,
      replyMove: replyMv ? `${replyMv.from}${replyMv.to}${replyMv.promotion ?? ''}` : null,
      replySan: replyMv?.san ?? null,
      themes,
      explanation: explain(cls, themes, played, bestMv, replyMv, before.score),
    });
  }
  evals.push(whiteEval(Math.min(moves.length, analysis.length - 1)));

  const habits = openingHabits(startFen, moves, userColor);
  if (habits.length) userThemes.opening = (userThemes.opening ?? 0) + habits.length;

  return {
    moves: reviews,
    evals,
    accuracy: {
      w: accN.w ? accSum.w / accN.w : 100,
      b: accN.b ? accSum.b / accN.b : 100,
    },
    counts,
    habits,
    userThemes,
  };
}

function explain(
  cls: MoveClass,
  themes: ThemeId[],
  _played: Move,
  best: Move | null,
  reply: Move | null,
  beforeScore: number,
): string {
  if (cls === 'best') return 'Best move: exactly what the engine would play.';
  if (cls === 'good') return 'Good move.';
  const label = cls === 'inaccuracy' ? 'Inaccuracy' : cls === 'mistake' ? 'Mistake' : 'Blunder';
  const parts: string[] = [];
  if (themes.includes('mate-allowed') && reply)
    parts.push(`This allows checkmate: your opponent can start with ${reply.san}.`);
  if (themes.includes('mate-missed') && best) {
    const n = Math.ceil((MATE - beforeScore) / 2);
    parts.push(`You had checkmate${n > 0 ? ` in ${n}` : ''}, starting with ${best.san}.`);
  }
  if (themes.includes('hanging') && reply?.captured)
    parts.push(`Your ${PIECE_NAME[reply.captured]} on ${reply.to} can be taken: ${reply.san}.`);
  if (themes.includes('fork-allowed') && reply) parts.push(`Your opponent can fork two of your pieces with ${reply.san}.`);
  if (themes.includes('missed-capture') && best?.captured)
    parts.push(`You could have won a ${PIECE_NAME[best.captured]} with ${best.san}.`);
  if (themes.includes('fork-missed') && best) parts.push(`${best.san} was a fork, attacking two pieces at once.`);
  if (!parts.length && best) parts.push(`A stronger move was ${best.san}.`);
  else if (best && !themes.includes('mate-missed') && !themes.includes('missed-capture') && !themes.includes('fork-missed'))
    parts.push(`Better was ${best.san}.`);
  return `${label}. ${parts.join(' ')}`;
}

/** Simple opening-principle checks on the user's first moves. */
export function openingHabits(startFen: string, moves: readonly string[], userColor: Color): string[] {
  const g = new Chess(startFen);
  const habits: string[] = [];
  let userMoveNo = 0;
  let queenEarly = false;
  let rimKnight = false;
  let castled = false;
  const movedFrom = new Map<string, number>(); // piece identity tracked by current square
  let repeated = false;

  for (const uci of moves) {
    const color = g.turn();
    const mv = safeMove(g, uci);
    if (!mv) break;
    if (color !== userColor) continue;
    userMoveNo++;
    if (mv.isKingsideCastle() || mv.isQueensideCastle()) castled = true;
    if (userMoveNo <= 4 && mv.piece === 'q') queenEarly = true;
    if (userMoveNo <= 8 && mv.piece === 'n' && (mv.to[0] === 'a' || mv.to[0] === 'h')) rimKnight = true;
    if (userMoveNo <= 8 && mv.piece !== 'p' && mv.piece !== 'k') {
      const count = (movedFrom.get(mv.from) ?? 0) + 1;
      movedFrom.delete(mv.from);
      movedFrom.set(mv.to, count);
      if (count >= 3) repeated = true;
    }
    if (userMoveNo === 12) break;
  }
  if (queenEarly) habits.push('You brought your queen out in the first four moves. Develop knights and bishops first.');
  if (rimKnight) habits.push('You put a knight on the edge of the board. Knights are stronger near the center.');
  if (repeated) habits.push('You moved the same piece three times in the opening. Develop new pieces instead.');
  if (!castled && userMoveNo >= 12) habits.push('You hadn’t castled after 12 moves. Castle early to keep your king safe.');
  return habits;
}
