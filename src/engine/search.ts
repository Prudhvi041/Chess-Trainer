import { evaluate, VALUE } from './evaluate';
import {
  FLAG_CAPTURE,
  movePromo,
  moveFlags,
  moveFrom,
  moveTo,
  moveToUci,
  pieceType,
  Position,
} from './position';

export const MATE = 30000;
const INF = 32000;
const MAX_PLY = 64;

export interface SearchOptions {
  /** Maximum depth in plies. */
  depth?: number;
  /** Soft time limit in milliseconds. */
  timeMs?: number;
}

export interface SearchResult {
  move: string | null;
  /** Score in centipawns from the side to move's view (mates are ±(MATE − plies)). */
  score: number;
  depth: number;
  nodes: number;
  pv: string[];
}

export const isMateScore = (s: number) => Math.abs(s) > MATE - 1000;
/** Moves (not plies) to mate, positive if the side to move mates. */
export const mateIn = (s: number) => (s > 0 ? Math.ceil((MATE - s) / 2) : -Math.ceil((MATE + s) / 2));

/* ───────── transposition table ───────── */
const TT_BITS = 19;
const TT_SIZE = 1 << TT_BITS;
const TT_MASK = TT_SIZE - 1;
const EXACT = 1;
const LOWER = 2;
const UPPER = 3;

class TranspositionTable {
  lo = new Uint32Array(TT_SIZE);
  hi = new Uint32Array(TT_SIZE);
  move = new Int32Array(TT_SIZE);
  score = new Int32Array(TT_SIZE);
  depth = new Int8Array(TT_SIZE);
  flag = new Int8Array(TT_SIZE);

  clear() {
    this.flag.fill(0);
  }
}

const tt = new TranspositionTable();

/**
 * Iterative-deepening alpha-beta (negamax) with quiescence search,
 * a transposition table, MVV-LVA / killer / history move ordering and check extensions.
 */
export class Searcher {
  private nodes = 0;
  private deadline = Infinity;
  private stopped = false;
  private killers = new Int32Array(MAX_PLY * 2);
  private history = new Int32Array(128 * 128);
  private pv: number[][] = Array.from({ length: MAX_PLY + 1 }, () => []);

  constructor(private pos: Position) {}

  search(opts: SearchOptions = {}): SearchResult {
    const maxDepth = Math.min(opts.depth ?? 64, MAX_PLY - 4);
    const start = Date.now();
    this.deadline = opts.timeMs ? start + opts.timeMs : Infinity;
    this.stopped = false;
    this.nodes = 0;
    this.killers.fill(0);
    this.history.fill(0);

    const legal = this.pos.legalMoves();
    if (legal.length === 0) {
      return { move: null, score: this.pos.inCheck() ? -MATE : 0, depth: 0, nodes: 0, pv: [] };
    }

    let best: SearchResult = { move: moveToUci(legal[0]), score: 0, depth: 0, nodes: 0, pv: [] };
    for (let depth = 1; depth <= maxDepth; depth++) {
      const score = this.negamax(depth, -INF, INF, 0);
      if (this.stopped) break;
      const line = this.pv[0].slice();
      best = {
        move: line.length ? moveToUci(line[0]) : best.move,
        score,
        depth,
        nodes: this.nodes,
        pv: line.map(moveToUci),
      };
      if (legal.length === 1 && depth >= 2) break;
      if (isMateScore(score) && depth >= MATE - Math.abs(score) + 1) break;
      // Don't start an iteration we likely can't finish.
      if (this.deadline !== Infinity && Date.now() - start > (this.deadline - start) * 0.55) break;
    }
    best.nodes = this.nodes;
    return best;
  }

  /** Score every legal root move with a full window (used to make weaker levels choose imperfectly). */
  scoreRootMoves(depth: number): { move: string; score: number }[] {
    this.deadline = Infinity;
    this.stopped = false;
    const out: { move: string; score: number }[] = [];
    for (const m of this.pos.legalMoves()) {
      this.pos.make(m);
      const score = depth <= 1 ? -this.quiesce(-INF, INF, 1) : -this.negamax(depth - 1, -INF, INF, 1);
      this.pos.unmake();
      out.push({ move: moveToUci(m), score });
    }
    return out.sort((a, b) => b.score - a.score);
  }

  private checkTime() {
    if ((this.nodes & 2047) === 0 && Date.now() > this.deadline) this.stopped = true;
  }

  private negamax(depth: number, alpha: number, beta: number, ply: number): number {
    const pos = this.pos;
    this.pv[ply].length = 0;
    this.nodes++;
    this.checkTime();
    if (this.stopped) return 0;

    if (ply > 0) {
      if (pos.halfmove >= 100 || pos.isRepetition()) return 0;
      // mate distance pruning
      alpha = Math.max(alpha, -MATE + ply);
      beta = Math.min(beta, MATE - ply - 1);
      if (alpha >= beta) return alpha;
    }

    const inCheck = pos.inCheck();
    if (inCheck) depth++;
    if (depth <= 0) return this.quiesce(alpha, beta, ply);
    if (ply >= MAX_PLY - 1) return evaluate(pos);

    // transposition table probe
    const idx = pos.hashLo & TT_MASK;
    let ttMove = 0;
    if (tt.flag[idx] && tt.lo[idx] === pos.hashLo && tt.hi[idx] === pos.hashHi) {
      ttMove = tt.move[idx];
      if (ply > 0 && tt.depth[idx] >= depth) {
        let s = tt.score[idx];
        if (s > MATE - 1000) s -= ply;
        else if (s < -MATE + 1000) s += ply;
        const f = tt.flag[idx];
        if (f === EXACT || (f === LOWER && s >= beta) || (f === UPPER && s <= alpha)) return s;
      }
    }

    const moves = pos.generate([]);
    const scores = this.orderScores(moves, ttMove, ply);
    const alphaOrig = alpha;
    let bestScore = -INF;
    let bestMove = 0;
    let legal = 0;

    for (let i = 0; i < moves.length; i++) {
      pickNext(moves, scores, i);
      const m = moves[i];
      if (!pos.make(m)) continue;
      legal++;
      let score: number;
      if (legal === 1) {
        score = -this.negamax(depth - 1, -beta, -alpha, ply + 1);
      } else {
        // principal variation search
        score = -this.negamax(depth - 1, -alpha - 1, -alpha, ply + 1);
        if (score > alpha && score < beta) score = -this.negamax(depth - 1, -beta, -alpha, ply + 1);
      }
      pos.unmake();
      if (this.stopped) return 0;

      if (score > bestScore) {
        bestScore = score;
        bestMove = m;
        if (score > alpha) {
          alpha = score;
          const child = this.pv[ply + 1];
          const line = this.pv[ply];
          line.length = 0;
          line.push(m, ...child);
        }
      }
      if (alpha >= beta) {
        if (!(moveFlags(m) & FLAG_CAPTURE) && !movePromo(m)) {
          if (this.killers[ply * 2] !== m) {
            this.killers[ply * 2 + 1] = this.killers[ply * 2];
            this.killers[ply * 2] = m;
          }
          this.history[moveFrom(m) * 128 + moveTo(m)] += depth * depth;
        }
        break;
      }
    }

    if (legal === 0) return inCheck ? -MATE + ply : 0;

    // store
    let stored = bestScore;
    if (stored > MATE - 1000) stored += ply;
    else if (stored < -MATE + 1000) stored -= ply;
    tt.lo[idx] = pos.hashLo;
    tt.hi[idx] = pos.hashHi;
    tt.move[idx] = bestMove;
    tt.score[idx] = stored;
    tt.depth[idx] = depth;
    tt.flag[idx] = bestScore <= alphaOrig ? UPPER : bestScore >= beta ? LOWER : EXACT;
    return bestScore;
  }

  private quiesce(alpha: number, beta: number, ply: number): number {
    const pos = this.pos;
    this.nodes++;
    this.checkTime();
    if (this.stopped) return 0;
    if (ply < MAX_PLY) this.pv[ply].length = 0;

    const standPat = evaluate(pos);
    if (ply >= MAX_PLY - 1) return standPat;
    if (standPat >= beta) return standPat;
    if (standPat > alpha) alpha = standPat;

    const moves = pos.generate([], true);
    const scores = this.orderScores(moves, 0, ply);
    for (let i = 0; i < moves.length; i++) {
      pickNext(moves, scores, i);
      const m = moves[i];
      // delta pruning: even winning this piece can't raise alpha
      const victim = pos.board[moveTo(m)];
      if (!movePromo(m) && victim && standPat + VALUE[pieceType(victim)] + 200 < alpha) continue;
      if (!pos.make(m)) continue;
      const score = -this.quiesce(-beta, -alpha, ply + 1);
      pos.unmake();
      if (this.stopped) return 0;
      if (score >= beta) return score;
      if (score > alpha) alpha = score;
    }
    return alpha;
  }

  private orderScores(moves: number[], ttMove: number, ply: number): Int32Array {
    const b = this.pos.board;
    const scores = new Int32Array(moves.length);
    for (let i = 0; i < moves.length; i++) {
      const m = moves[i];
      if (m === ttMove) scores[i] = 1_000_000;
      else if (moveFlags(m) & FLAG_CAPTURE) {
        const victim = b[moveTo(m)];
        const attacker = b[moveFrom(m)];
        scores[i] = 100_000 + (victim ? VALUE[pieceType(victim)] : 100) * 10 - VALUE[pieceType(attacker)] / 10;
      } else if (movePromo(m)) scores[i] = 90_000 + VALUE[movePromo(m)];
      else if (m === this.killers[ply * 2]) scores[i] = 80_000;
      else if (m === this.killers[ply * 2 + 1]) scores[i] = 79_000;
      else scores[i] = this.history[moveFrom(m) * 128 + moveTo(m)];
    }
    return scores;
  }
}

/** Selection sort step: move the best-scored remaining move to index i. */
function pickNext(moves: number[], scores: Int32Array, i: number) {
  let best = i;
  for (let j = i + 1; j < moves.length; j++) if (scores[j] > scores[best]) best = j;
  if (best !== i) {
    const m = moves[i];
    moves[i] = moves[best];
    moves[best] = m;
    const s = scores[i];
    scores[i] = scores[best];
    scores[best] = s;
  }
}

export function clearTranspositionTable() {
  tt.clear();
}

/** Convenience: search a FEN. */
export function searchFen(fen: string, opts: SearchOptions): SearchResult {
  return new Searcher(new Position(fen)).search(opts);
}
