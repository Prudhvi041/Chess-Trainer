import { useState } from 'react';
import { BADGES } from '../lib/badges';
import { formatMs, formatPercent } from '../lib/format';
import type { Stats } from '../hooks/useStats';
import { BadgeMedal } from './BadgeMedal';
import { StatGrid } from './StatGrid';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  stats: Stats;
  averageScore: number | null;
  accuracy: number | null;
  averageResponseMs: number | null;
  onReset: () => void;
}

export function StatsModal({ open, onClose, stats, averageScore, accuracy, averageResponseMs, onReset }: Props) {
  const [confirming, setConfirming] = useState(false);
  const close = () => {
    setConfirming(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={close} title="Statistics" className="max-w-lg">
      <div className="px-6 pb-6 pt-7">
        <h3 className="font-display text-2xl font-semibold">Your statistics</h3>
        <p className="mt-1 text-sm text-ink-400">Saved on this device.</p>

        <div className="mt-5">
          <StatGrid
            items={[
              { label: 'Games played', value: stats.gamesPlayed },
              { label: 'Highest score', value: stats.highestScore, highlight: true },
              { label: 'Average score', value: averageScore == null ? '—' : averageScore.toFixed(1) },
              { label: 'Fastest response', value: formatMs(stats.fastestMs) },
              { label: 'Accuracy', value: formatPercent(accuracy), hint: `${stats.totalCorrect} / ${stats.totalAttempts} squares` },
              { label: 'Avg response', value: formatMs(averageResponseMs) },
              { label: 'Best streak', value: stats.bestStreak, hint: 'answers under 1.5s in a row' },
              { label: 'Squares found', value: stats.totalCorrect },
            ]}
          />
        </div>

        <div className="mt-5 flex items-center justify-between rounded-2xl bg-ink-900/[0.04] p-3 dark:bg-white/[0.05]">
          {BADGES.map((b) => (
            <div key={b.id} className="flex flex-col items-center gap-1">
              <BadgeMedal badge={b} unlocked={stats.highestScore >= b.threshold} size="sm" />
              <span className="text-[10px] font-medium text-ink-400">{b.name}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-2">
          {confirming ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-500 dark:text-ink-300">Erase everything?</span>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  onReset();
                  setConfirming(false);
                }}
              >
                Yes, reset
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setConfirming(true)}>
              Reset statistics
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={close} data-autofocus>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
