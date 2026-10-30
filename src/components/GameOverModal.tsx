import { badgeForScore } from '../lib/badges';
import { formatSquare } from '../lib/coords';
import { average, formatMs, formatPercent } from '../lib/format';
import type { GameSummary } from '../game/types';
import { BadgeMedal } from './BadgeMedal';
import { StatGrid } from './StatGrid';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { ClockIcon, PlayIcon } from './ui/icons';

interface Props {
  open: boolean;
  summary: (GameSummary & { previousBest: number }) | null;
  onRestart: () => void;
  onClose: () => void;
}

export function GameOverModal({ open, summary, onRestart, onClose }: Props) {
  if (!summary) return null;
  const { score, previousBest, failure } = summary;
  const best = Math.max(previousBest, score);
  const isNewBest = score > previousBest && score > 0;
  const badge = badgeForScore(score);
  const timeout = failure.reason === 'timeout';

  return (
    <Modal open={open} onClose={onClose} title="Game over">
      <div className="relative overflow-hidden px-6 pb-6 pt-8 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-48 w-72 rounded-full bg-rose-500/20 blur-3xl"
        />
        <span className="relative mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-rose-500/10 text-rose-500">
          {timeout ? <ClockIcon size={22} /> : <span className="text-2xl leading-none">✕</span>}
        </span>
        <h3 className="relative mt-3 font-display text-3xl font-semibold">Game Over</h3>
        <p className="relative mt-1 text-sm text-ink-500 dark:text-ink-300">
          {timeout ? (
            <>
              Time ran out on <strong className="text-ink-800 dark:text-white">{formatSquare(failure.target)}</strong>.
            </>
          ) : (
            <>
              You clicked{' '}
              <strong className="text-rose-500">{failure.clicked ? formatSquare(failure.clicked) : '—'}</strong> — the
              target was <strong className="text-emerald-600 dark:text-emerald-400">{formatSquare(failure.target)}</strong>.
            </>
          )}
        </p>

        <div className="relative mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-ink-900/[0.04] p-4 dark:bg-white/[0.05]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">Final score</div>
            <div className="mt-1 font-display text-5xl font-semibold">{score}</div>
          </div>
          <div className="relative rounded-2xl bg-gold-400/10 p-4 ring-1 ring-inset ring-gold-400/30">
            {isNewBest && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 animate-pop whitespace-nowrap rounded-full bg-gradient-to-b from-gold-300 to-gold-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-900 shadow">
                New best!
              </span>
            )}
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-600 dark:text-gold-300">
              Best score
            </div>
            <div className="mt-1 font-display text-5xl font-semibold text-gold-600 dark:text-gold-300">{best}</div>
          </div>
        </div>

        {badge && (
          <div className="relative mt-4 flex items-center gap-3 rounded-2xl bg-ink-900/[0.04] p-3 text-left dark:bg-white/[0.05]">
            <BadgeMedal badge={badge} unlocked size="sm" />
            <div>
              <div className="text-sm font-semibold">{badge.name} badge</div>
              <div className="text-xs text-ink-400">Earned this run · {badge.threshold}+ points</div>
            </div>
          </div>
        )}

        <div className="relative mt-4 text-left">
          <StatGrid
            columns={3}
            items={[
              { label: 'Accuracy', value: formatPercent(summary.attempts ? summary.correct / summary.attempts : null) },
              { label: 'Avg time', value: formatMs(average(summary.responseTimes)) },
              { label: 'Fastest', value: formatMs(summary.fastestMs) },
            ]}
          />
        </div>

        <div className="relative mt-6 flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            Review board
          </Button>
          <Button className="flex-[2]" onClick={onRestart} data-autofocus>
            <PlayIcon size={14} />
            Restart
          </Button>
        </div>
      </div>
    </Modal>
  );
}
