import { BADGES, nextBadge } from '../lib/badges';
import { cn } from '../lib/format';
import { BadgeMedal } from './BadgeMedal';
import { Card, CardTitle } from './ui/Card';

export function BadgeShelf({ highestScore }: { highestScore: number }) {
  const next = nextBadge(highestScore);
  const prevThreshold = next ? (BADGES[BADGES.indexOf(next) - 1]?.threshold ?? 0) : 0;
  const progress = next ? (highestScore - prevThreshold) / (next.threshold - prevThreshold) : 1;

  return (
    <Card className="p-5">
      <CardTitle>Achievements</CardTitle>
      <div className="grid grid-cols-4 gap-2">
        {BADGES.map((badge) => {
          const unlocked = highestScore >= badge.threshold;
          return (
            <div key={badge.id} className="flex flex-col items-center text-center">
              <BadgeMedal badge={badge} unlocked={unlocked} />
              <span
                className={cn(
                  'mt-2 text-xs font-semibold',
                  unlocked ? badge.text : 'text-ink-400 dark:text-ink-500',
                )}
              >
                {badge.name}
              </span>
              <span className="text-[10px] text-ink-400">{badge.threshold} pts</span>
            </div>
          );
        })}
      </div>
      <div className="mt-4">
        <div className="mb-1.5 flex justify-between text-xs text-ink-500 dark:text-ink-300">
          <span>{next ? `Next: ${next.name}` : 'All badges earned'}</span>
          <span className="font-mono">
            {next ? `${highestScore} / ${next.threshold}` : '♚ Grandmaster of squares'}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-ink-900/[0.06] dark:bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold-300 to-gold-500 transition-[width] duration-700"
            style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
