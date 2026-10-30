import { memo } from 'react';
import { formatSquare, type Square } from '../lib/coords';
import { cn } from '../lib/format';

export type SquareFeedback = 'correct' | 'wrong' | 'answer' | null;

interface Props {
  square: Square;
  light: boolean;
  /** Easy mode: square shares a rank or file with the hovered square. */
  inHoverLine: boolean;
  hovered: boolean;
  feedback: SquareFeedback;
  /** Changes on every new feedback so animations replay on remount. */
  feedbackKey: number;
  interactive: boolean;
  onSelect: (square: Square) => void;
  onHover: (square: Square | null) => void;
}

function BoardSquareImpl({
  square,
  light,
  inHoverLine,
  hovered,
  feedback,
  feedbackKey,
  interactive,
  onSelect,
  onHover,
}: Props) {
  return (
    <button
      type="button"
      aria-label={`Square ${formatSquare(square)}`}
      data-square={square.id}
      disabled={!interactive}
      onClick={() => onSelect(square)}
      onPointerEnter={(e) => e.pointerType === 'mouse' && onHover(square)}
      className={cn(
        'group relative aspect-square select-none overflow-hidden outline-none',
        'focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-300',
        light ? 'bg-board-light' : 'bg-board-dark',
        interactive ? 'cursor-pointer' : 'cursor-default',
        feedback === 'wrong' && 'animate-shake',
      )}
    >
      {/* subtle surface texture */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0',
          light
            ? 'bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.35),transparent_60%)]'
            : 'bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.12),transparent_60%)]',
        )}
      />

      {/* Easy mode rank/file guide */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 transition-opacity duration-150',
          light ? 'bg-gold-300/45' : 'bg-gold-400/45',
          inHoverLine ? 'opacity-100' : 'opacity-0',
        )}
      />

      {/* Hover */}
      {interactive && (
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-0 transition-all duration-150',
            hovered
              ? 'bg-white/20 shadow-[inset_0_0_0_3px_rgba(212,170,58,0.95)]'
              : 'group-hover:bg-white/15 group-hover:shadow-[inset_0_0_0_3px_rgba(212,170,58,0.8)]',
          )}
        />
      )}

      {feedback === 'correct' && (
        <span key={feedbackKey} aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="absolute inset-0 animate-[fade-in_120ms_ease-out_reverse_both] bg-emerald-400/50" />
          <span className="h-full w-full animate-ripple rounded-full bg-emerald-300/80" />
        </span>
      )}

      {feedback === 'wrong' && (
        <span
          key={feedbackKey}
          aria-hidden
          className="pointer-events-none absolute inset-0 grid animate-fade-in place-items-center bg-rose-500/75 font-mono text-[clamp(9px,2.4vw,15px)] font-bold text-white"
        >
          {formatSquare(square)}
        </span>
      )}

      {feedback === 'answer' && (
        <span
          key={feedbackKey}
          aria-hidden
          className="pointer-events-none absolute inset-0 grid animate-glow place-items-center bg-emerald-500/40 font-mono text-[clamp(9px,2.4vw,15px)] font-bold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]"
        >
          {formatSquare(square)}
        </span>
      )}
    </button>
  );
}

export const BoardSquare = memo(BoardSquareImpl);
