import { useCallback, useMemo, useState } from 'react';
import { displaySquares, edgeLabels, isLightSquare, type Orientation, type Square } from '../lib/coords';
import { cn } from '../lib/format';
import { BoardSquare, type SquareFeedback } from './BoardSquare';

interface Props {
  orientation: Orientation;
  interactive: boolean;
  showLabels: boolean;
  highlightLines: boolean;
  /** Square to flash green (last correct answer) with a replay key. */
  correctFlash: { square: Square; key: number } | null;
  /** After a mistake: the clicked square and the real target. */
  failure: { clicked: Square | null; target: Square } | null;
  onSelect: (square: Square) => void;
  overlay?: React.ReactNode;
}

export function Board({
  orientation,
  interactive,
  showLabels,
  highlightLines,
  correctFlash,
  failure,
  onSelect,
  overlay,
}: Props) {
  const [hovered, setHovered] = useState<Square | null>(null);
  const squares = useMemo(() => displaySquares(orientation), [orientation]);
  const labels = useMemo(() => edgeLabels(orientation), [orientation]);

  const handleHover = useCallback((sq: Square | null) => setHovered(sq), []);

  const feedbackFor = (sq: Square): SquareFeedback => {
    if (failure) {
      if (failure.clicked?.id === sq.id) return 'wrong';
      if (failure.target.id === sq.id) return 'answer';
      return null;
    }
    return correctFlash?.square.id === sq.id ? 'correct' : null;
  };

  const labelClass = cn(
    'grid place-items-center font-mono text-[10px] font-bold uppercase text-[#E9D8B4]/75 transition-opacity duration-500 sm:text-xs',
    showLabels ? 'opacity-100' : 'opacity-0',
  );

  return (
    <div
      className={cn(
        'relative w-full rounded-[18px] p-1.5 shadow-board sm:p-2',
        'bg-gradient-to-br from-[#3A2A1E] via-board-frame to-[#1E1610]',
        'dark:from-[#221A14] dark:via-board-frameDark dark:to-black',
        'ring-1 ring-inset ring-white/10',
      )}
    >
      <div className="grid grid-cols-[1.1rem_1fr_1.1rem] grid-rows-[1.1rem_auto_1.1rem] sm:grid-cols-[1.5rem_1fr_1.5rem] sm:grid-rows-[1.5rem_auto_1.5rem]">
        {/* top labels */}
        <div />
        <div className="grid grid-cols-8">
          {labels.cols.map((l, i) => (
            <span key={`t${i}${l}`} className={labelClass} aria-hidden>
              {l}
            </span>
          ))}
        </div>
        <div />

        {/* left labels */}
        <div className="grid grid-rows-8">
          {labels.rows.map((l, i) => (
            <span key={`l${i}${l}`} className={labelClass} aria-hidden>
              {l}
            </span>
          ))}
        </div>

        {/* board */}
        <div className="relative overflow-hidden rounded-[6px] ring-1 ring-black/40">
          <div
            key={orientation}
            role="grid"
            aria-label="Chessboard"
            className="grid animate-board-turn touch-manipulation grid-cols-8"
            onPointerLeave={() => setHovered(null)}
          >
            {squares.map((sq) => {
              const feedback = feedbackFor(sq);
              return (
                <BoardSquare
                  key={sq.id}
                  square={sq}
                  light={isLightSquare(sq)}
                  inHoverLine={
                    highlightLines &&
                    interactive &&
                    hovered !== null &&
                    (hovered.file === sq.file || hovered.rank === sq.rank)
                  }
                  hovered={interactive && hovered?.id === sq.id}
                  feedback={feedback}
                  feedbackKey={feedback === 'correct' ? (correctFlash?.key ?? 0) : 0}
                  interactive={interactive}
                  onSelect={onSelect}
                  onHover={handleHover}
                />
              );
            })}
          </div>
          {overlay}
        </div>

        {/* right labels */}
        <div className="grid grid-rows-8">
          {labels.rows.map((l, i) => (
            <span key={`r${i}${l}`} className={labelClass} aria-hidden>
              {l}
            </span>
          ))}
        </div>

        {/* bottom labels */}
        <div />
        <div className="grid grid-cols-8">
          {labels.cols.map((l, i) => (
            <span key={`b${i}${l}`} className={labelClass} aria-hidden>
              {l}
            </span>
          ))}
        </div>
        <div />
      </div>
    </div>
  );
}
