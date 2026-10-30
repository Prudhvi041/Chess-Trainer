import { formatSquare, type Square } from '../lib/coords';
import { cn } from '../lib/format';
import type { GameMode, GameStatus } from '../game/types';
import { Card } from './ui/Card';
import { BrainIcon, ClockIcon, RotateIcon } from './ui/icons';

interface Props {
  status: GameStatus;
  target: Square | null;
  hidden: boolean;
  round: number;
  mode: GameMode;
  timeLimitMs: number | null;
  revealMs: number | null;
  level: string | null;
  orientationLabel: string;
  showOrientation: boolean;
}

export function TargetDisplay({
  status,
  target,
  hidden,
  round,
  mode,
  timeLimitMs,
  revealMs,
  level,
  orientationLabel,
  showOrientation,
}: Props) {
  const playing = status === 'playing';
  const over = status === 'over';

  return (
    <Card className="relative overflow-hidden px-5 pb-4 pt-3.5">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-gold-300/20 blur-3xl dark:bg-gold-400/10"
      />
      <div className="flex items-center justify-between gap-3">
        <span className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
          {over ? 'Target was' : 'Click'}
        </span>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {showOrientation && <Chip icon={<RotateIcon size={12} />}>{orientationLabel}</Chip>}
          {mode === 'memory' && (
            <Chip icon={<BrainIcon size={12} />}>
              Memory{level ? ` · ${level}` : ''}
              <span className="hidden sm:inline">
                {playing && revealMs ? ` · ${(revealMs / 1000).toFixed(2)}s` : ''}
              </span>
            </Chip>
          )}
          {timeLimitMs && (
            <Chip icon={<ClockIcon size={12} />}>{(timeLimitMs / 1000).toFixed(1)}s</Chip>
          )}
        </div>
      </div>

      <div className="relative flex h-[4.5rem] items-center justify-center sm:h-20" aria-live="polite">
        {status === 'idle' || !target ? (
          <span className="font-display text-2xl font-medium text-ink-400 sm:text-3xl">Ready when you are</span>
        ) : hidden && playing ? (
          <span key={`h${round}`} className="flex animate-fade-in flex-col items-center">
            <span className="flex gap-3">
              <span className="h-3 w-3 animate-pulse rounded-full bg-gold-400" />
              <span className="h-3 w-3 animate-pulse rounded-full bg-gold-400 [animation-delay:150ms]" />
            </span>
            <span className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-ink-400">
              Recall the square
            </span>
          </span>
        ) : (
          <span
            key={round}
            className={cn(
              'animate-pop font-display text-6xl font-semibold tracking-tight sm:text-7xl',
              over
                ? 'text-rose-500 dark:text-rose-400'
                : 'bg-gradient-to-b from-ink-900 to-ink-600 bg-clip-text text-transparent dark:from-white dark:to-gold-200',
            )}
            aria-label={`Target ${formatSquare(target)}`}
          >
            {formatSquare(target)}
          </span>
        )}
      </div>

      {/* Countdown */}
      <div className="h-1.5 overflow-hidden rounded-full bg-ink-900/[0.06] dark:bg-white/[0.06]">
        {playing && timeLimitMs ? (
          <div
            key={round}
            className="timer-bar h-full origin-left rounded-full bg-gradient-to-r from-rose-500 via-gold-400 to-emerald-400"
            style={{ '--timer-ms': `${timeLimitMs}ms` } as React.CSSProperties}
          />
        ) : null}
      </div>
    </Card>
  );
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-ink-900/[0.05] px-2 py-0.5 text-[11px] font-medium text-ink-500 dark:bg-white/[0.07] dark:text-ink-200">
      {icon}
      {children}
    </span>
  );
}
