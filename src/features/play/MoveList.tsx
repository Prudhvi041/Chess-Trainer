import { Chess } from 'chess.js';
import { useEffect, useMemo, useRef } from 'react';
import type { MoveClass } from '../../coach/review';
import { cn } from '../../lib/format';

export const CLASS_SYMBOL: Partial<Record<MoveClass, string>> = { inaccuracy: '?!', mistake: '?', blunder: '??' };
export const CLASS_TEXT: Partial<Record<MoveClass, string>> = {
  inaccuracy: 'text-amber-600 dark:text-amber-400',
  mistake: 'text-orange-600 dark:text-orange-400',
  blunder: 'text-rose-600 dark:text-rose-400',
};

interface Props {
  startFen: string;
  moves: readonly string[];
  classes?: readonly MoveClass[];
  /** Index of the highlighted move (ply), if any. */
  selected?: number | null;
  onSelect?: (ply: number) => void;
  className?: string;
}

export function MoveList({ startFen, moves, classes, selected = null, onSelect, className }: Props) {
  const sans = useMemo(() => {
    const g = new Chess(startFen);
    return moves.map((m) => g.move({ from: m.slice(0, 2), to: m.slice(2, 4), promotion: m[4] }).san);
  }, [startFen, moves]);
  const firstIsBlack = new Chess(startFen).turn() === 'b';
  const scroller = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeRef.current) activeRef.current.scrollIntoView({ block: 'nearest' });
    else if (selected == null && scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [selected, sans.length]);

  const rows: { no: number; white?: number; black?: number }[] = [];
  sans.forEach((_, ply) => {
    const index = ply + (firstIsBlack ? 1 : 0);
    const no = Math.floor(index / 2) + 1;
    if (index % 2 === 0) rows.push({ no, white: ply });
    else if (rows.length && rows[rows.length - 1].no === no) rows[rows.length - 1].black = ply;
    else rows.push({ no, black: ply });
  });

  const cell = (ply: number | undefined) => {
    if (ply === undefined) return <span />;
    const cls = classes?.[ply];
    const active = selected === ply;
    return (
      <button
        ref={active ? activeRef : undefined}
        type="button"
        disabled={!onSelect}
        onClick={() => onSelect?.(ply)}
        className={cn(
          'flex items-center gap-1 rounded-md px-2 py-1 text-left font-mono text-[13px] transition',
          onSelect && 'hover:bg-ink-900/[0.06] dark:hover:bg-white/[0.08]',
          active && 'bg-gold-400/25 font-semibold ring-1 ring-inset ring-gold-400/50',
        )}
      >
        {sans[ply]}
        {cls && CLASS_SYMBOL[cls] && <span className={cn('font-bold', CLASS_TEXT[cls])}>{CLASS_SYMBOL[cls]}</span>}
      </button>
    );
  };

  return (
    <div ref={scroller} className={cn('overflow-y-auto rounded-xl bg-ink-900/[0.03] p-1.5 dark:bg-white/[0.04]', className)}>
      {rows.length === 0 ? (
        <p className="px-2 py-3 text-center text-xs text-ink-400">No moves yet.</p>
      ) : (
        <div className="grid grid-cols-[2.2rem_1fr_1fr] items-center gap-y-0.5">
          {rows.map((r) => (
            <div key={r.no} className="contents">
              <span className="pl-1 font-mono text-xs text-ink-400">{r.no}.</span>
              {cell(r.white)}
              {cell(r.black)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
