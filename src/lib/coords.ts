/**
 * Coordinate system helpers. Everything is generated programmatically —
 * no hard-coded square lists.
 *
 * Internally a square is (file, rank) with both in 0..7:
 *   file 0 = "a" … 7 = "h", rank 0 = "1" … 7 = "8".
 */

export const BOARD_SIZE = 8;

export const FILES: readonly string[] = Array.from({ length: BOARD_SIZE }, (_, i) =>
  String.fromCharCode('a'.charCodeAt(0) + i),
);

export const RANKS: readonly string[] = Array.from({ length: BOARD_SIZE }, (_, i) => String(i + 1));

export interface Square {
  readonly file: number;
  readonly rank: number;
  /** Algebraic id, lowercase, e.g. "e4". */
  readonly id: string;
}

const createSquare = (file: number, rank: number): Square =>
  Object.freeze({ file, rank, id: `${FILES[file]}${RANKS[rank]}` });

/** All 64 squares, indexed as file * 8 + rank. Instances are stable (good for memoization). */
export const ALL_SQUARES: readonly Square[] = Object.freeze(
  FILES.flatMap((_, file) => RANKS.map((_, rank) => createSquare(file, rank))),
);

export const getSquare = (file: number, rank: number): Square => ALL_SQUARES[file * BOARD_SIZE + rank];

export const squareFromId = (id: string): Square | undefined => {
  const file = FILES.indexOf(id[0]?.toLowerCase());
  const rank = RANKS.indexOf(id.slice(1));
  return file < 0 || rank < 0 ? undefined : getSquare(file, rank);
};

/** Display format used in the UI, e.g. "E4". */
export const formatSquare = (square: Square): string => square.id.toUpperCase();

/** a1 is a dark square, so light squares have an odd (file + rank) sum. */
export const isLightSquare = (square: Square): boolean => (square.file + square.rank) % 2 === 1;

export type Rng = () => number;

/** Random square, never equal to `exclude` (avoids the same target twice in a row). */
export function randomSquare(exclude?: Square | null, rng: Rng = Math.random): Square {
  let square: Square;
  do {
    square = ALL_SQUARES[Math.floor(rng() * ALL_SQUARES.length)];
  } while (exclude && square.id === exclude.id);
  return square;
}

/* ───────────────────────── Orientation ───────────────────────── */

/**
 * Board orientation in degrees, clockwise from White's point of view.
 *   0   – White at the bottom (standard)
 *   180 – Black at the bottom
 *   90 / 270 – sideways
 */
export type Orientation = 0 | 90 | 180 | 270;
export const ORIENTATIONS: readonly Orientation[] = [0, 90, 180, 270];

export const ORIENTATION_LABEL: Record<Orientation, string> = {
  0: "White's view",
  90: 'Sideways (a1 top-left)',
  180: "Black's view",
  270: 'Sideways (h8 top-left)',
};

export const ORIENTATION_SHORT: Record<Orientation, string> = {
  0: 'White',
  90: 'Turned ↻',
  180: 'Black',
  270: 'Turned ↺',
};

/** Which square is drawn at display cell (row, col), with row 0 at the top. */
export function squareAt(row: number, col: number, orientation: Orientation): Square {
  const last = BOARD_SIZE - 1;
  switch (orientation) {
    case 0:
      return getSquare(col, last - row);
    case 180:
      return getSquare(last - col, row);
    case 90:
      return getSquare(row, col);
    case 270:
      return getSquare(last - row, last - col);
  }
}

/** The 64 squares in display order (row-major) for an orientation. */
export function displaySquares(orientation: Orientation): Square[] {
  const out: Square[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) out.push(squareAt(row, col, orientation));
  }
  return out;
}

/** Edge labels for each display row (left/right) and column (top/bottom). */
export function edgeLabels(orientation: Orientation): { rows: string[]; cols: string[] } {
  const indices = Array.from({ length: BOARD_SIZE }, (_, i) => i);
  const sideways = orientation === 90 || orientation === 270;
  return {
    rows: indices.map((row) => {
      const sq = squareAt(row, 0, orientation);
      return sideways ? FILES[sq.file].toUpperCase() : RANKS[sq.rank];
    }),
    cols: indices.map((col) => {
      const sq = squareAt(BOARD_SIZE - 1, col, orientation);
      return sideways ? RANKS[sq.rank] : FILES[sq.file].toUpperCase();
    }),
  };
}

/** A random orientation different from the current one. */
export function nextOrientation(current: Orientation, rng: Rng = Math.random): Orientation {
  const options = ORIENTATIONS.filter((o) => o !== current);
  return options[Math.floor(rng() * options.length)];
}
