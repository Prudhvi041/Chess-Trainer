import { useCallback, useMemo, useState } from 'react';
import { displaySquares, isLightSquare, type Orientation, type Square } from '../lib/coords';
import { BoardFrame } from './BoardFrame';
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

  const handleHover = useCallback((sq: Square | null) => setHovered(sq), []);

  const feedbackFor = (sq: Square): SquareFeedback => {
    if (failure) {
      if (failure.clicked?.id === sq.id) return 'wrong';
      if (failure.target.id === sq.id) return 'answer';
      return null;
    }
    return correctFlash?.square.id === sq.id ? 'correct' : null;
  };

  return (
    <BoardFrame orientation={orientation} showLabels={showLabels}>
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
    </BoardFrame>
  );
}
