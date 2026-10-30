import { useMemo } from 'react';
import { edgeLabels, type Orientation } from '../lib/coords';
import { cn } from '../lib/format';

interface Props {
  orientation: Orientation;
  showLabels?: boolean;
  children: React.ReactNode;
}

/** Wooden frame with coordinate labels on all four sides. */
export function BoardFrame({ orientation, showLabels = true, children }: Props) {
  const labels = useMemo(() => edgeLabels(orientation), [orientation]);
  const labelClass = cn(
    'grid place-items-center font-mono text-[10px] font-bold uppercase text-[#E9D8B4]/75 transition-opacity duration-500 sm:text-xs',
    showLabels ? 'opacity-100' : 'opacity-0',
  );
  const row = (prefix: string) =>
    labels.rows.map((l, i) => (
      <span key={`${prefix}${i}${l}`} className={labelClass} aria-hidden>
        {l}
      </span>
    ));
  const col = (prefix: string) =>
    labels.cols.map((l, i) => (
      <span key={`${prefix}${i}${l}`} className={labelClass} aria-hidden>
        {l}
      </span>
    ));

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
        <div />
        <div className="grid grid-cols-8">{col('t')}</div>
        <div />
        <div className="grid grid-rows-8">{row('l')}</div>
        <div className="relative overflow-hidden rounded-[6px] ring-1 ring-black/40">{children}</div>
        <div className="grid grid-rows-8">{row('r')}</div>
        <div />
        <div className="grid grid-cols-8">{col('b')}</div>
        <div />
      </div>
    </div>
  );
}
