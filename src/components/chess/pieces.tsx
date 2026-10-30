import { memo } from 'react';

/**
 * Original "Rank & File" piece set — hand-drawn SVG paths (45×45 viewBox),
 * released with this project under MIT. No external assets.
 */

export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

const BASE = 'M9.5 39h26v-2.6a3 3 0 0 0-3-3h-20a3 3 0 0 0-3 3z';

const SHAPES: Record<PieceType, { body: string; details?: string; dots?: [number, number, number][] }> = {
  p: {
    body:
      'M22.5 8.5a5.6 5.6 0 0 0-3.4 10.05C16.6 19.6 15 21 15 22.4h3.2C16.7 25.3 15.6 29 15.2 33.4h14.6c-.4-4.4-1.5-8.1-3-11h3.2c0-1.4-1.6-2.8-4.1-3.85A5.6 5.6 0 0 0 22.5 8.5z',
  },
  r: {
    body:
      'M11.5 9h4.2v3.4h3.6V9h6.4v3.4h3.6V9h4.2v6.6l-3 2.6v12.2l2.4 3H12.1l2.4-3V18.2l-3-2.6z',
    details: 'M14.6 18.2h15.8M14.6 30.4h15.8',
  },
  b: {
    body:
      'M22.5 9.2c-4.8 3.6-7.6 8.3-7.6 12.6 0 2.4 1 4 2.6 5.1L16.3 33.4h12.4L27.5 26.9c1.6-1.1 2.6-2.7 2.6-5.1 0-4.3-2.8-9-7.6-12.6z',
    details: 'M24.6 14.4l-4 5.4M17.6 26.9h9.8',
    dots: [[22.5, 6.9, 2.3]],
  },
  n: {
    body:
      'M14.5 33.4c.2-4.6 2.4-7.4 5.4-9.8 1.3-1 1.6-2.4 1.1-3.4-1.4 1.2-3.3 1.8-5.3 2.3-1.6.4-2.4 1.6-3.3 2.7-1 1.1-2.9.8-3.6-.5-.7-1.3-.4-2.6.4-3.8 1.9-2.8 4.3-5.4 6.4-8.4l.5-3.6 2.3 2.2 1.6-3.4 1.9 3.3c6.4.7 11.2 6.1 11.4 13.9.1 3.8-.4 7-1.1 9.9z',
    details: 'M14.2 19.4h.01',
    dots: [[18.2, 14.6, 1.1]],
  },
  q: {
    body:
      'M12.2 33.4l-3.6-16.6 6.6 6.4.6-10.6 6.7 10.4 6.7-10.4.6 10.6 6.6-6.4-3.6 16.6z',
    details: 'M13.4 29.2h18.2',
    dots: [
      [8.4, 15.2, 2.2],
      [15.8, 11.2, 2.2],
      [22.5, 9.6, 2.3],
      [29.2, 11.2, 2.2],
      [36.6, 15.2, 2.2],
    ],
  },
  k: {
    body:
      'M12.6 33.4c-2.8-4.6-3.4-9.6-.4-12.4 2.7-2.5 7-1.7 10.3 2.1 3.3-3.8 7.6-4.6 10.3-2.1 3 2.8 2.4 7.8-.4 12.4z M22.5 23.1c-2-2.9-2.6-5.8-.9-8.4h1.8c1.7 2.6 1.1 5.5-.9 8.4z',
    details: 'M13.6 29.2h17.8',
  },
};

interface Props {
  type: PieceType;
  color: PieceColor;
  className?: string;
}

function PieceImpl({ type, color, className }: Props) {
  const shape = SHAPES[type];
  const white = color === 'w';
  const fill = white ? '#FBF8F2' : '#24201C';
  const stroke = white ? '#2A241E' : '#0B0A09';
  const detail = white ? '#2A241E' : '#D9C9A8';
  return (
    <svg viewBox="0 0 45 45" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`g-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={white ? '#FFFFFF' : '#3A332C'} />
          <stop offset="1" stopColor={fill} />
        </linearGradient>
      </defs>
      <g
        fill={`url(#g-${color})`}
        stroke={stroke}
        strokeWidth={1.6}
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ filter: 'drop-shadow(0 1.2px 0.8px rgba(0,0,0,0.35))' }}
      >
        <path d={BASE} />
        <path d={shape.body} fillRule="evenodd" />
        {shape.dots?.map(([cx, cy, r]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />)}
      </g>
      {shape.details && (
        <path
          d={shape.details}
          fill="none"
          stroke={detail}
          strokeWidth={1.4}
          strokeLinecap="round"
        />
      )}
      {type === 'k' && (
        <path d="M22.5 5v8.6M18.6 8.6h7.8" fill="none" stroke={stroke} strokeWidth={2.4} strokeLinecap="round" />
      )}
    </svg>
  );
}

export const Piece = memo(PieceImpl);

export const PIECE_NAMES: Record<PieceType, string> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
};
