import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { displaySquares, isLightSquare, squareFromId, type Orientation } from '../../lib/coords';
import { cn } from '../../lib/format';
import type { PieceMap } from '../../learn/chess';
import type { Arrow } from '../../learn/types';
import { BoardFrame } from '../BoardFrame';
import { Piece } from './pieces';

export type SquareMark = 'picked' | 'correct' | 'wrong' | 'missed';
export type ArrowTone = 'green' | 'blue' | 'red' | 'gold';
export interface ToneArrow {
  from: string;
  to: string;
  tone: ArrowTone;
}

const ARROW_COLORS: Record<ArrowTone, string> = {
  green: 'rgba(22,128,74,0.8)',
  blue: 'rgba(37,99,235,0.75)',
  red: 'rgba(225,29,72,0.75)',
  gold: 'rgba(190,145,42,0.85)',
};

export interface ChessBoardProps {
  pieces: PieceMap;
  flip?: boolean;
  interactive?: boolean;
  highlights?: readonly string[];
  arrows?: readonly Arrow[];
  /** Extra colored arrows (review: best move / played move / hint). */
  toneArrows?: readonly ToneArrow[];
  stars?: readonly string[];
  lastMove?: Arrow | null;
  checkSquare?: string | null;
  selected?: string | null;
  targets?: readonly { to: string; capture: boolean }[];
  marks?: Readonly<Record<string, SquareMark>>;
  flash?: { square: string; tone: 'good' | 'bad'; key: number } | null;
  canDrag?: (square: string) => boolean;
  onSquareClick?: (square: string) => void;
  onDragStart?: (square: string) => void;
  onDrop?: (from: string, to: string) => void;
  overlay?: React.ReactNode;
}

const DRAG_THRESHOLD = 5;

export function ChessBoard({
  pieces,
  flip = false,
  interactive = false,
  highlights = [],
  arrows = [],
  toneArrows = [],
  stars = [],
  lastMove = null,
  checkSquare = null,
  selected = null,
  targets = [],
  marks = {},
  flash = null,
  canDrag,
  onSquareClick,
  onDragStart,
  onDrop,
  overlay,
}: ChessBoardProps) {
  const orientation: Orientation = flip ? 180 : 0;
  const squares = useMemo(() => displaySquares(orientation), [orientation]);
  const highlightSet = useMemo(() => new Set(highlights), [highlights]);
  const starSet = useMemo(() => new Set(stars), [stars]);
  const targetMap = useMemo(() => new Map(targets.map((t) => [t.to, t.capture])), [targets]);

  /* ── drag & drop (pointer events: mouse, touch and pen) ── */
  const gridRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ from: string; x: number; y: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const [dragFrom, setDragFrom] = useState<string | null>(null);
  const [ghostSize, setGhostSize] = useState(48);

  const moveGhost = (x: number, y: number) => {
    const el = ghostRef.current;
    if (el) el.style.transform = `translate(${x - ghostSize / 2}px, ${y - ghostSize / 2}px)`;
  };

  const endDrag = useCallback(() => {
    drag.current = null;
    setDragFrom(null);
  }, []);

  useEffect(() => {
    if (!dragFrom) return;
    // Position the ghost as soon as it mounts.
    const d = drag.current;
    if (d) moveGhost(d.x, d.y);
  });

  const handlePointerDown = (e: React.PointerEvent, square: string) => {
    if (!interactive || !canDrag?.(square) || e.button !== 0) return;
    drag.current = { from: square, x: e.clientX, y: e.clientY, moved: false };
    const startX = e.clientX;
    const startY = e.clientY;
    const rect = gridRef.current?.getBoundingClientRect();
    if (rect) setGhostSize(rect.width / 8);

    const onMove = (ev: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      d.x = ev.clientX;
      d.y = ev.clientY;
      if (!d.moved && Math.hypot(ev.clientX - startX, ev.clientY - startY) > DRAG_THRESHOLD) {
        d.moved = true;
        setDragFrom(d.from);
        onDragStart?.(d.from);
      }
      if (d.moved) {
        ev.preventDefault();
        moveGhost(ev.clientX, ev.clientY);
      }
    };
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      const d = drag.current;
      if (d?.moved) {
        suppressClick.current = true;
        window.setTimeout(() => (suppressClick.current = false), 0);
        const target = document
          .elementFromPoint(ev.clientX, ev.clientY)
          ?.closest<HTMLElement>('[data-sq]')?.dataset.sq;
        if (target && target !== d.from) onDrop?.(d.from, target);
      }
      endDrag();
    };
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  const draggedPiece = dragFrom ? pieces[dragFrom] : null;

  return (
    <BoardFrame orientation={orientation}>
      <div ref={gridRef} role="grid" aria-label="Chessboard" className="relative grid select-none grid-cols-8">
        {squares.map((sq) => {
          const id = sq.id;
          const piece = pieces[id];
          const light = isLightSquare(sq);
          const mark = marks[id];
          const isTarget = targetMap.has(id);
          const isCapture = targetMap.get(id);
          const draggable = interactive && !!canDrag?.(id) && !!piece;
          return (
            <button
              key={id}
              type="button"
              data-sq={id}
              aria-label={`${id.toUpperCase()}${piece ? `, ${piece.color === 'w' ? 'white' : 'black'} ${piece.type}` : ''}`}
              disabled={!interactive}
              onPointerDown={(e) => handlePointerDown(e, id)}
              onClick={() => {
                if (suppressClick.current) return;
                onSquareClick?.(id);
              }}
              className={cn(
                'relative aspect-square outline-none',
                light ? 'bg-board-light' : 'bg-board-dark',
                interactive ? 'cursor-pointer' : 'cursor-default',
                draggable && 'touch-none',
                'focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-300',
              )}
            >
              {/* lesson highlight */}
              {highlightSet.has(id) && (
                <span aria-hidden className="absolute inset-0 bg-gold-300/55 mix-blend-multiply dark:bg-gold-400/55" />
              )}
              {/* last move */}
              {lastMove && (lastMove[0] === id || lastMove[1] === id) && (
                <span aria-hidden className="absolute inset-0 bg-[#E3C75A]/50" />
              )}
              {/* selection */}
              {selected === id && <span aria-hidden className="absolute inset-0 bg-emerald-400/45" />}
              {/* check */}
              {checkSquare === id && (
                <span
                  aria-hidden
                  className="absolute inset-0 bg-[radial-gradient(circle,rgba(244,63,94,0.95)_0%,rgba(244,63,94,0.55)_40%,transparent_72%)]"
                />
              )}
              {/* select-exercise marks */}
              {mark && <MarkLayer mark={mark} />}
              {/* flash */}
              {flash?.square === id && (
                <span
                  key={flash.key}
                  aria-hidden
                  className={cn(
                    'absolute inset-0 animate-[fade-in_500ms_ease-out_reverse_both]',
                    flash.tone === 'good' ? 'bg-emerald-400/70' : 'bg-rose-500/70',
                  )}
                />
              )}

              {/* star */}
              {starSet.has(id) && !piece && <Star />}

              {/* piece */}
              {piece && (
                <span
                  className={cn(
                    'absolute inset-[4%] transition-opacity',
                    dragFrom === id && 'opacity-30',
                    lastMove?.[1] === id && 'animate-[pop_220ms_ease-out_both]',
                  )}
                >
                  <Piece type={piece.type} color={piece.color} className="h-full w-full" />
                  {starSet.has(id) && (
                    <span className="absolute -right-0.5 -top-0.5 h-[38%] w-[38%]">
                      <Star small />
                    </span>
                  )}
                </span>
              )}

              {/* legal move indicators */}
              {isTarget &&
                (isCapture ? (
                  <span aria-hidden className="absolute inset-[3%] rounded-full border-[5px] border-emerald-600/45" />
                ) : (
                  <span aria-hidden className="absolute inset-0 grid place-items-center">
                    <span className="h-[30%] w-[30%] rounded-full bg-emerald-700/40" />
                  </span>
                ))}
            </button>
          );
        })}
        <ArrowLayer
          arrows={[...arrows.map(([from, to]) => ({ from, to, tone: 'green' as const })), ...toneArrows]}
          flip={flip}
        />
      </div>
      {overlay}

      {draggedPiece &&
        createPortal(
          <div
            ref={ghostRef}
            aria-hidden
            className="pointer-events-none fixed left-0 top-0 z-[80] drop-shadow-2xl"
            style={{ width: ghostSize * 1.12, height: ghostSize * 1.12 }}
          >
            <Piece type={draggedPiece.type} color={draggedPiece.color} className="h-full w-full" />
          </div>,
          document.body,
        )}
    </BoardFrame>
  );
}

function MarkLayer({ mark }: { mark: SquareMark }) {
  switch (mark) {
    case 'picked':
      return (
        <span aria-hidden className="absolute inset-0 grid place-items-center">
          <span className="h-[42%] w-[42%] animate-pop rounded-full bg-gold-400 shadow-[0_0_0_3px_rgba(255,255,255,0.6)]" />
        </span>
      );
    case 'correct':
      return <span aria-hidden className="absolute inset-0 animate-fade-in bg-emerald-500/55" />;
    case 'wrong':
      return (
        <span aria-hidden className="absolute inset-0 grid animate-fade-in place-items-center bg-rose-500/60 text-lg font-bold text-white">
          ✕
        </span>
      );
    case 'missed':
      return (
        <span
          aria-hidden
          className="absolute inset-[6%] animate-fade-in rounded-md border-[3px] border-dashed border-emerald-600 dark:border-emerald-500"
        />
      );
  }
}

function Star({ small }: { small?: boolean }) {
  return (
    <span aria-hidden className={cn('absolute inset-0 grid place-items-center', !small && 'animate-[bump_1.6s_ease-in-out_infinite]')}>
      <svg viewBox="0 0 24 24" className={small ? 'h-full w-full' : 'h-[58%] w-[58%] drop-shadow'}>
        <path
          d="M12 2.6l2.9 6 6.5.8-4.8 4.5 1.2 6.5L12 17.3l-5.8 3.1 1.2-6.5L2.6 9.4l6.5-.8z"
          fill="#F5C842"
          stroke="#8A6414"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function ArrowLayer({ arrows, flip }: { arrows: readonly ToneArrow[]; flip: boolean }) {
  if (!arrows.length) return null;
  const center = (id: string) => {
    const sq = squareFromId(id)!;
    const col = flip ? 7 - sq.file : sq.file;
    const row = flip ? sq.rank : 7 - sq.rank;
    return { x: col + 0.5, y: row + 0.5 };
  };
  const tones = [...new Set(arrows.map((a) => a.tone))];
  return (
    <svg aria-hidden viewBox="0 0 8 8" className="pointer-events-none absolute inset-0 z-20 h-full w-full">
      <defs>
        {tones.map((tone) => (
          <marker key={tone} id={`arrowhead-${tone}`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto">
            <path d="M0 0L10 5L0 10z" fill={ARROW_COLORS[tone]} />
          </marker>
        ))}
      </defs>
      {arrows.map(({ from, to, tone }) => {
        const a = center(from);
        const b = center(to);
        const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        const shorten = 0.42;
        const bx = b.x - ((b.x - a.x) / len) * shorten;
        const by = b.y - ((b.y - a.y) / len) * shorten;
        return (
          <line
            key={`${from}${to}${tone}`}
            x1={a.x}
            y1={a.y}
            x2={bx}
            y2={by}
            stroke={ARROW_COLORS[tone]}
            strokeWidth={0.17}
            strokeLinecap="round"
            markerEnd={`url(#arrowhead-${tone})`}
          />
        );
      })}
    </svg>
  );
}
