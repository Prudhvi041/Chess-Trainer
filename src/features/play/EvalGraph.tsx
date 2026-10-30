import { useMemo, useRef, useState } from 'react';
import type { MoveClass } from '../../coach/review';

interface Props {
  /** White-perspective evaluation in pawns per position (clamped ±10). */
  evals: readonly number[];
  /** Classification of the move leading to position i+1. */
  classes: readonly MoveClass[];
  sans: readonly string[];
  selected: number | null;
  onSelect: (ply: number) => void;
}

const W = 600;
const H = 120;
const PAD_Y = 8;
/** Compress large evaluations so small edges stay visible (≈ win chance shape). */
const squash = (v: number) => Math.tanh(v / 4);

const MARK: Partial<Record<MoveClass, { color: string; label: string }>> = {
  blunder: { color: '#E11D48', label: 'Blunder' },
  mistake: { color: '#EA580C', label: 'Mistake' },
};

/**
 * Evaluation over the game: above the midline = White better, below = Black better.
 * Single series, neutral ink; blunders/mistakes marked with labelled dots.
 */
export function EvalGraph({ evals, classes, sans, selected, onSelect }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const n = Math.max(2, evals.length);
  const x = (i: number) => (i / (n - 1)) * W;
  const y = (v: number) => H / 2 - squash(v) * (H / 2 - PAD_Y);

  const { line, area } = useMemo(() => {
    const pts = evals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
    return {
      line: `M${pts.join('L')}`,
      area: `M0,${H / 2}L${pts.join('L')}L${x(evals.length - 1).toFixed(1)},${H / 2}Z`,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evals]);

  const indexFromEvent = (clientX: number) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const i = Math.round(((clientX - rect.left) / rect.width) * (n - 1));
    return Math.max(0, Math.min(evals.length - 1, i));
  };

  // position i is after move i-1
  const active = hover ?? (selected != null ? selected + 1 : null);
  const fmt = (v: number) => (Math.abs(v) >= 9.95 ? (v > 0 ? 'White winning' : 'Black winning') : `${v > 0 ? '+' : ''}${v.toFixed(1)}`);
  const tipMove = active != null && active > 0 ? active - 1 : null;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Evaluation graph. Above the middle line White is better, below Black is better."
        className="h-24 w-full cursor-crosshair touch-none overflow-visible rounded-xl bg-ink-900/[0.04] dark:bg-white/[0.04]"
        onPointerMove={(e) => setHover(indexFromEvent(e.clientX))}
        onPointerLeave={() => setHover(null)}
        onPointerDown={(e) => {
          const i = indexFromEvent(e.clientX);
          if (i > 0) onSelect(i - 1);
        }}
      >
        <path d={area} className="fill-ink-900/[0.12] dark:fill-white/[0.14]" />
        <line x1={0} x2={W} y1={H / 2} y2={H / 2} className="stroke-ink-400/50" strokeWidth={1} vectorEffect="non-scaling-stroke" strokeDasharray="3 3" />
        <path d={line} fill="none" className="stroke-ink-700 dark:stroke-ink-100" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        {active != null && (
          <line x1={x(active)} x2={x(active)} y1={0} y2={H} className="stroke-gold-500" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        )}
      </svg>
      {/* marks as HTML so they stay round under non-uniform scaling */}
      {classes.map((c, ply) =>
        MARK[c] ? (
          <span
            key={ply}
            aria-hidden
            className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-ink-50 dark:ring-ink-800"
            style={{
              left: `${(x(ply + 1) / W) * 100}%`,
              top: `${(y(evals[ply + 1] ?? 0) / H) * 96}px`,
              background: MARK[c]!.color,
            }}
          />
        ) : null,
      )}
      {tipMove != null && sans[tipMove] && (
        <div
          className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink-900 px-2.5 py-1 text-xs font-medium text-white shadow-lg dark:bg-white dark:text-ink-900"
          style={{ left: `${Math.min(92, Math.max(8, (x(active!) / W) * 100))}%` }}
        >
          {Math.floor(tipMove / 2) + 1}
          {tipMove % 2 ? '…' : '.'} {sans[tipMove]} · {fmt(evals[active!])}
          {MARK[classes[tipMove]] && ` · ${MARK[classes[tipMove]]!.label}`}
        </div>
      )}
      <div className="mt-1 flex justify-between text-[10px] font-medium uppercase tracking-wider text-ink-400">
        <span>White better ↑</span>
        <span>↓ Black better</span>
      </div>
    </div>
  );
}
