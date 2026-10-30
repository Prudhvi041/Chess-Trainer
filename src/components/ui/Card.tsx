import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/format';

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-ink-200/70 bg-white/70 shadow-card backdrop-blur-xl',
        'dark:border-white/[0.06] dark:bg-ink-800/60',
        className,
      )}
      {...rest}
    />
  );
}

export function CardTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400 dark:text-ink-300">
        {children}
      </h2>
      {action}
    </div>
  );
}
