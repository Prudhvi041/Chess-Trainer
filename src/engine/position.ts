/**
 * Rank & File engine — board representation and move generation.
 * 0x88 board, integer-encoded moves, incremental Zobrist hashing.
 * Written from scratch for this project (MIT).
 */

export const WHITE = 0;
export const BLACK = 1;
export const PAWN = 1;
export const KNIGHT = 2;
export const BISHOP = 3;
export const ROOK = 4;
export const QUEEN = 5;
export const KING = 6;

export const FLAG_CAPTURE = 1;
export const FLAG_EP = 2;
export const FLAG_CASTLE = 4;
export const FLAG_DOUBLE = 8;

const KNIGHT_OFFSETS = [33, 31, 18, 14, -33, -31, -18, -14];
const KING_OFFSETS = [1, -1, 16, -16, 15, 17, -15, -17];
const BISHOP_DIRS = [15, 17, -15, -17];
const ROOK_DIRS = [1, -1, 16, -16];

export const pieceColor = (p: number) => p >> 3;
export const pieceType = (p: number) => p & 7;
export const makePiece = (color: number, type: number) => (color << 3) | type;

export const moveFrom = (m: number) => m & 0x7f;
export const moveTo = (m: number) => (m >> 7) & 0x7f;
export const movePromo = (m: number) => (m >> 14) & 7;
export const moveFlags = (m: number) => (m >> 17) & 15;
const encode = (from: number, to: number, promo: number, flags: number) =>
  from | (to << 7) | (promo << 14) | (flags << 17);

export const sqName = (sq: number) => 'abcdefgh'[sq & 7] + String((sq >> 4) + 1);
export const sqFromName = (n: string) => (n.charCodeAt(0) - 97) + (Number(n[1]) - 1) * 16;

export function moveToUci(m: number): string {
  const promo = movePromo(m);
  return sqName(moveFrom(m)) + sqName(moveTo(m)) + (promo ? ' pnbrqk'[promo] : '');
}

/* ── Zobrist keys (deterministic PRNG so hashes are reproducible) ── */
let seed = 0x9e3779b9;
const rand32 = () => {
  seed ^= seed << 13;
  seed ^= seed >>> 17;
  seed ^= seed << 5;
  return seed >>> 0;
};
const Z_PIECE_LO = new Uint32Array(16 * 128).map(rand32);
const Z_PIECE_HI = new Uint32Array(16 * 128).map(rand32);
const Z_CASTLE_LO = new Uint32Array(16).map(rand32);
const Z_CASTLE_HI = new Uint32Array(16).map(rand32);
const Z_EP_LO = new Uint32Array(128).map(rand32);
const Z_EP_HI = new Uint32Array(128).map(rand32);
const Z_SIDE_LO = rand32();
const Z_SIDE_HI = rand32();

/** Castling-rights mask applied when a move touches a square. */
const CASTLE_MASK = new Uint8Array(128).fill(15);
CASTLE_MASK[0x00] = 15 & ~2; // a1
CASTLE_MASK[0x07] = 15 & ~1; // h1
CASTLE_MASK[0x04] = 15 & ~3; // e1
CASTLE_MASK[0x70] = 15 & ~8; // a8
CASTLE_MASK[0x77] = 15 & ~4; // h8
CASTLE_MASK[0x74] = 15 & ~12; // e8

export class Position {
  board = new Int8Array(128);
  side = WHITE;
  castling = 0; // 1=K 2=Q 4=k 8=q
  ep = -1;
  halfmove = 0;
  fullmove = 1;
  kings = [0x04, 0x74];
  hashLo = 0;
  hashHi = 0;

  // undo stack
  private stack: number[] = [];
  // hash history for repetition detection
  histLo: number[] = [];
  histHi: number[] = [];

  constructor(fen?: string) {
    if (fen) this.load(fen);
  }

  load(fen: string) {
    const [placement, side, castle, ep, half, full] = fen.trim().split(/\s+/);
    this.board.fill(0);
    let rank = 7;
    let file = 0;
    for (const ch of placement) {
      if (ch === '/') {
        rank--;
        file = 0;
      } else if (/\d/.test(ch)) {
        file += Number(ch);
      } else {
        const color = ch === ch.toUpperCase() ? WHITE : BLACK;
        const type = ' pnbrqk'.indexOf(ch.toLowerCase());
        const sq = rank * 16 + file;
        this.board[sq] = makePiece(color, type);
        if (type === KING) this.kings[color] = sq;
        file++;
      }
    }
    this.side = side === 'b' ? BLACK : WHITE;
    this.castling = 0;
    if (castle && castle !== '-') {
      if (castle.includes('K')) this.castling |= 1;
      if (castle.includes('Q')) this.castling |= 2;
      if (castle.includes('k')) this.castling |= 4;
      if (castle.includes('q')) this.castling |= 8;
    }
    this.ep = ep && ep !== '-' ? sqFromName(ep) : -1;
    this.halfmove = Number(half ?? 0) || 0;
    this.fullmove = Number(full ?? 1) || 1;
    this.stack = [];
    this.computeHash();
    this.histLo = [this.hashLo];
    this.histHi = [this.hashHi];
  }

  private computeHash() {
    let lo = 0;
    let hi = 0;
    for (let sq = 0; sq < 128; sq++) {
      if (sq & 0x88) continue;
      const p = this.board[sq];
      if (p) {
        lo ^= Z_PIECE_LO[p * 128 + sq];
        hi ^= Z_PIECE_HI[p * 128 + sq];
      }
    }
    lo ^= Z_CASTLE_LO[this.castling];
    hi ^= Z_CASTLE_HI[this.castling];
    if (this.ep >= 0) {
      lo ^= Z_EP_LO[this.ep];
      hi ^= Z_EP_HI[this.ep];
    }
    if (this.side === BLACK) {
      lo ^= Z_SIDE_LO;
      hi ^= Z_SIDE_HI;
    }
    this.hashLo = lo >>> 0;
    this.hashHi = hi >>> 0;
  }

  /** Is `sq` attacked by any piece of color `by`? */
  attacked(sq: number, by: number): boolean {
    const b = this.board;
    // pawns
    if (by === WHITE) {
      const a = sq - 15;
      const c = sq - 17;
      if (!(a & 0x88) && b[a] === makePiece(WHITE, PAWN)) return true;
      if (!(c & 0x88) && b[c] === makePiece(WHITE, PAWN)) return true;
    } else {
      const a = sq + 15;
      const c = sq + 17;
      if (!(a & 0x88) && b[a] === makePiece(BLACK, PAWN)) return true;
      if (!(c & 0x88) && b[c] === makePiece(BLACK, PAWN)) return true;
    }
    const knight = makePiece(by, KNIGHT);
    for (const o of KNIGHT_OFFSETS) {
      const t = sq + o;
      if (!(t & 0x88) && b[t] === knight) return true;
    }
    const king = makePiece(by, KING);
    for (const o of KING_OFFSETS) {
      const t = sq + o;
      if (!(t & 0x88) && b[t] === king) return true;
    }
    const bishop = makePiece(by, BISHOP);
    const rook = makePiece(by, ROOK);
    const queen = makePiece(by, QUEEN);
    for (const d of BISHOP_DIRS) {
      let t = sq + d;
      while (!(t & 0x88)) {
        const p = b[t];
        if (p) {
          if (p === bishop || p === queen) return true;
          break;
        }
        t += d;
      }
    }
    for (const d of ROOK_DIRS) {
      let t = sq + d;
      while (!(t & 0x88)) {
        const p = b[t];
        if (p) {
          if (p === rook || p === queen) return true;
          break;
        }
        t += d;
      }
    }
    return false;
  }

  inCheck(color = this.side): boolean {
    return this.attacked(this.kings[color], color ^ 1);
  }

  /** Pseudo-legal moves. With `capturesOnly`, only captures and queen promotions. */
  generate(out: number[], capturesOnly = false): number[] {
    const b = this.board;
    const us = this.side;
    const them = us ^ 1;
    for (let sq = 0; sq < 128; sq++) {
      if (sq & 0x88) {
        sq += 7;
        continue;
      }
      const p = b[sq];
      if (!p || pieceColor(p) !== us) continue;
      const type = pieceType(p);

      if (type === PAWN) {
        const dir = us === WHITE ? 16 : -16;
        const startRank = us === WHITE ? 1 : 6;
        const promoRank = us === WHITE ? 7 : 0;
        const to = sq + dir;
        if (!(to & 0x88) && b[to] === 0) {
          if (to >> 4 === promoRank) {
            out.push(encode(sq, to, QUEEN, 0));
            if (!capturesOnly) {
              out.push(encode(sq, to, ROOK, 0));
              out.push(encode(sq, to, BISHOP, 0));
              out.push(encode(sq, to, KNIGHT, 0));
            }
          } else if (!capturesOnly) {
            out.push(encode(sq, to, 0, 0));
            const two = to + dir;
            if (sq >> 4 === startRank && b[two] === 0) out.push(encode(sq, two, 0, FLAG_DOUBLE));
          }
        }
        for (const c of [dir - 1, dir + 1]) {
          const t = sq + c;
          if (t & 0x88) continue;
          const q = b[t];
          if (q && pieceColor(q) === them) {
            if (t >> 4 === promoRank) {
              out.push(encode(sq, t, QUEEN, FLAG_CAPTURE));
              if (!capturesOnly) {
                out.push(encode(sq, t, ROOK, FLAG_CAPTURE));
                out.push(encode(sq, t, BISHOP, FLAG_CAPTURE));
                out.push(encode(sq, t, KNIGHT, FLAG_CAPTURE));
              }
            } else out.push(encode(sq, t, 0, FLAG_CAPTURE));
          } else if (t === this.ep && !q) {
            out.push(encode(sq, t, 0, FLAG_CAPTURE | FLAG_EP));
          }
        }
        continue;
      }

      if (type === KNIGHT || type === KING) {
        const offsets = type === KNIGHT ? KNIGHT_OFFSETS : KING_OFFSETS;
        for (const o of offsets) {
          const t = sq + o;
          if (t & 0x88) continue;
          const q = b[t];
          if (!q) {
            if (!capturesOnly) out.push(encode(sq, t, 0, 0));
          } else if (pieceColor(q) === them) out.push(encode(sq, t, 0, FLAG_CAPTURE));
        }
        if (type === KING && !capturesOnly) this.generateCastles(out);
        continue;
      }

      const dirs = type === BISHOP ? BISHOP_DIRS : type === ROOK ? ROOK_DIRS : KING_OFFSETS;
      for (const d of dirs) {
        let t = sq + d;
        while (!(t & 0x88)) {
          const q = b[t];
          if (!q) {
            if (!capturesOnly) out.push(encode(sq, t, 0, 0));
          } else {
            if (pieceColor(q) === them) out.push(encode(sq, t, 0, FLAG_CAPTURE));
            break;
          }
          t += d;
        }
      }
    }
    return out;
  }

  private generateCastles(out: number[]) {
    const b = this.board;
    const us = this.side;
    const them = us ^ 1;
    if (us === WHITE && this.kings[WHITE] === 0x04) {
      if (this.castling & 1 && !b[5] && !b[6] && b[7] === makePiece(WHITE, ROOK) &&
          !this.attacked(4, them) && !this.attacked(5, them) && !this.attacked(6, them))
        out.push(encode(4, 6, 0, FLAG_CASTLE));
      if (this.castling & 2 && !b[3] && !b[2] && !b[1] && b[0] === makePiece(WHITE, ROOK) &&
          !this.attacked(4, them) && !this.attacked(3, them) && !this.attacked(2, them))
        out.push(encode(4, 2, 0, FLAG_CASTLE));
    } else if (us === BLACK && this.kings[BLACK] === 0x74) {
      if (this.castling & 4 && !b[0x75] && !b[0x76] && b[0x77] === makePiece(BLACK, ROOK) &&
          !this.attacked(0x74, them) && !this.attacked(0x75, them) && !this.attacked(0x76, them))
        out.push(encode(0x74, 0x76, 0, FLAG_CASTLE));
      if (this.castling & 8 && !b[0x73] && !b[0x72] && !b[0x71] && b[0x70] === makePiece(BLACK, ROOK) &&
          !this.attacked(0x74, them) && !this.attacked(0x73, them) && !this.attacked(0x72, them))
        out.push(encode(0x74, 0x72, 0, FLAG_CASTLE));
    }
  }

  private xorPiece(p: number, sq: number) {
    this.hashLo ^= Z_PIECE_LO[p * 128 + sq];
    this.hashHi ^= Z_PIECE_HI[p * 128 + sq];
  }

  /** Make a pseudo-legal move. Returns false (and undoes it) if it leaves the king in check. */
  make(m: number): boolean {
    const b = this.board;
    const from = moveFrom(m);
    const to = moveTo(m);
    const promo = movePromo(m);
    const flags = moveFlags(m);
    const us = this.side;
    const piece = b[from];
    const capSq = flags & FLAG_EP ? to + (us === WHITE ? -16 : 16) : to;
    const captured = b[capSq];

    this.stack.push(m, captured, this.castling, this.ep, this.halfmove, this.hashLo, this.hashHi);

    // hash: remove old state
    this.hashLo ^= Z_CASTLE_LO[this.castling];
    this.hashHi ^= Z_CASTLE_HI[this.castling];
    if (this.ep >= 0) {
      this.hashLo ^= Z_EP_LO[this.ep];
      this.hashHi ^= Z_EP_HI[this.ep];
    }

    this.xorPiece(piece, from);
    if (captured) this.xorPiece(captured, capSq);
    const placed = promo ? makePiece(us, promo) : piece;
    this.xorPiece(placed, to);

    b[capSq] = 0;
    b[from] = 0;
    b[to] = placed;

    if (flags & FLAG_CASTLE) {
      let rf = 0;
      let rt = 0;
      if (to === 0x06) (rf = 0x07), (rt = 0x05);
      else if (to === 0x02) (rf = 0x00), (rt = 0x03);
      else if (to === 0x76) (rf = 0x77), (rt = 0x75);
      else (rf = 0x70), (rt = 0x73);
      const rook = b[rf];
      b[rf] = 0;
      b[rt] = rook;
      this.xorPiece(rook, rf);
      this.xorPiece(rook, rt);
    }
    if (pieceType(piece) === KING) this.kings[us] = to;

    this.castling &= CASTLE_MASK[from] & CASTLE_MASK[to];
    this.ep = flags & FLAG_DOUBLE ? (from + to) >> 1 : -1;
    this.halfmove = pieceType(piece) === PAWN || captured ? 0 : this.halfmove + 1;
    if (us === BLACK) this.fullmove++;
    this.side = us ^ 1;

    this.hashLo ^= Z_CASTLE_LO[this.castling] ^ Z_SIDE_LO;
    this.hashHi ^= Z_CASTLE_HI[this.castling] ^ Z_SIDE_HI;
    if (this.ep >= 0) {
      this.hashLo ^= Z_EP_LO[this.ep];
      this.hashHi ^= Z_EP_HI[this.ep];
    }
    this.hashLo >>>= 0;
    this.hashHi >>>= 0;
    this.histLo.push(this.hashLo);
    this.histHi.push(this.hashHi);

    if (this.attacked(this.kings[us], us ^ 1)) {
      this.unmake();
      return false;
    }
    return true;
  }

  unmake() {
    const s = this.stack;
    const hashHi = s.pop()!;
    const hashLo = s.pop()!;
    const halfmove = s.pop()!;
    const ep = s.pop()!;
    const castling = s.pop()!;
    const captured = s.pop()!;
    const m = s.pop()!;
    this.histLo.pop();
    this.histHi.pop();

    const b = this.board;
    const from = moveFrom(m);
    const to = moveTo(m);
    const flags = moveFlags(m);
    this.side ^= 1;
    const us = this.side;
    if (us === BLACK) this.fullmove--;
    const moved = b[to];
    const piece = movePromo(m) ? makePiece(us, PAWN) : moved;
    b[to] = 0;
    b[from] = piece;
    const capSq = flags & FLAG_EP ? to + (us === WHITE ? -16 : 16) : to;
    b[capSq] = captured;
    if (flags & FLAG_CASTLE) {
      let rf = 0;
      let rt = 0;
      if (to === 0x06) (rf = 0x07), (rt = 0x05);
      else if (to === 0x02) (rf = 0x00), (rt = 0x03);
      else if (to === 0x76) (rf = 0x77), (rt = 0x75);
      else (rf = 0x70), (rt = 0x73);
      b[rf] = b[rt];
      b[rt] = 0;
    }
    if (pieceType(piece) === KING) this.kings[us] = from;
    this.castling = castling;
    this.ep = ep;
    this.halfmove = halfmove;
    this.hashLo = hashLo;
    this.hashHi = hashHi;
  }

  legalMoves(): number[] {
    const out: number[] = [];
    for (const m of this.generate([])) {
      if (this.make(m)) {
        out.push(m);
        this.unmake();
      }
    }
    return out;
  }

  /** Has the current position occurred before (since the last irreversible move)? */
  isRepetition(): boolean {
    const n = this.histLo.length - 1;
    const lo = this.hashLo;
    const hi = this.hashHi;
    for (let i = n - 2; i >= 0 && i >= n - this.halfmove; i -= 2) {
      if (this.histLo[i] === lo && this.histHi[i] === hi) return true;
    }
    return false;
  }

  /** Find the encoded legal move matching a UCI string. */
  parseUci(uci: string): number | null {
    for (const m of this.legalMoves()) if (moveToUci(m) === uci) return m;
    return null;
  }
}
