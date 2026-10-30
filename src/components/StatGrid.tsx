import { cn } from '../lib/format';

export interface StatItem {
  label: string;
  value: string | number;
  hint?: string;
  highlight?: boolean;
}

export function StatGrid({ items, columns = 2 }: { items: StatItem[]; columns?: 2 | 3 }) {
  return (
    <dl className={cn('grid gap-2.5', columns === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            'rounded-2xl bg-ink-900/[0.04] px-3.5 py-3 dark:bg-white/[0.05]',
            item.highlight && 'bg-gold-400/10 ring-1 ring-inset ring-gold-400/30 dark:bg-gold-400/10',
          )}
        >
          <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">{item.label}</dt>
          <dd className="mt-1 font-mono text-xl font-bold text-ink-900 dark:text-white">{item.value}</dd>
          {item.hint && <dd className="text-[11px] text-ink-400">{item.hint}</dd>}
        </div>
      ))}
    </dl>
  );
}
