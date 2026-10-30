import { Card } from '../../components/ui/Card';
import { cn } from '../../lib/format';

/** Shared two-column layout for drills and puzzles: board left, coaching panel right. */
export function TrainerShell({ board, children }: { board: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
      <div className="mx-auto w-full" style={{ maxWidth: 'max(320px, min(640px, calc(100dvh - 190px)))' }}>
        {board}
      </div>
      <Card className="order-first flex flex-col p-5 sm:p-6 lg:order-none lg:sticky lg:top-4 lg:min-h-[400px]">{children}</Card>
    </div>
  );
}

export function FeedbackBox({ tone, children }: { tone: 'success' | 'error' | 'info'; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'animate-scale-in rounded-2xl px-4 py-3 text-sm leading-snug',
        tone === 'success' && 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200',
        tone === 'error' && 'bg-rose-500/10 text-rose-700 dark:text-rose-200',
        tone === 'info' && 'bg-ink-900/[0.05] text-ink-700 dark:bg-white/[0.06] dark:text-ink-100',
      )}
    >
      {children}
    </div>
  );
}
