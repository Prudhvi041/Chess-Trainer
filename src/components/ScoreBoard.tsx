import { formatPercent } from '../lib/format';
import { cn } from '../lib/format';


interface Props {
  score: number;
  best: number;
  streak: number;
  accuracy: number | null;
}

export function ScoreBoard({ score, best, streak, accuracy }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3">
      <Tile label="Score" value={score} accent="text-ink-900 dark:text-white" />
      <Tile label="Best" value={best} accent="text-gold-500 dark:text-gold-300" />
      <Tile
        label="Streak"
        value={streak}
       
        accent={streak >= 3 ? 'text-orange-500' : 'text-ink-900 dark:text-white'}
        title="Consecutive answers under 1.5 seconds"
        hot={streak >= 3}
      />
      <Tile
        label="Accuracy"
        value={formatPercent(accuracy)}
       
        accent="text-emerald-600 dark:text-emerald-400"
        title="Lifetime correct answers ÷ attempts"
      />
    </div>
  );
}

function Tile({
  label,
  value,
  accent,
  title,
  hot,
}: {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  accent: string;
  title?: string;
  hot?: boolean;
}) {
  return (
    <div
      title={title}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-ink-200/70 bg-white/70 px-2.5 py-2 shadow-card backdrop-blur-xl sm:px-4 sm:py-3',
        'dark:border-white/[0.06] dark:bg-ink-800/60',
        hot && 'border-orange-400/40 dark:border-orange-400/30',
      )}
    >
      {hot && (
        <span
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-orange-500/15 to-transparent dark:from-orange-500/20"
        />
      )}
      <div className="relative truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400 sm:text-[11px]">
                {label}
      </div>
      <div key={String(value)} className={cn('relative mt-0.5 animate-bump font-mono text-lg font-bold sm:text-2xl', accent)}>
        {value}
      </div>
    </div>
  );
}
