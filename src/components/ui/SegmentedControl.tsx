import { cn } from '../../lib/format';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

interface Props<T extends string> {
  label: string;
  value: T;
  options: readonly SegmentOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
}

export function SegmentedControl<T extends string>({ label, value, options, onChange, disabled }: Props<T>) {
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const active = options[index];

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-ink-700 dark:text-ink-100">{label}</span>
        {active?.hint && <span className="truncate text-xs text-ink-400">{active.hint}</span>}
      </div>
      <div
        role="radiogroup"
        aria-label={label}
        className={cn(
          'relative grid rounded-xl bg-ink-900/[0.05] p-1 dark:bg-black/30',
          disabled && 'opacity-60',
        )}
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        <span
          aria-hidden
          className="absolute inset-y-1 left-1 rounded-lg bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-300 ease-[cubic-bezier(.2,.9,.3,1)] dark:bg-ink-600 dark:ring-white/10"
          style={{
            width: `calc((100% - 0.5rem) / ${options.length})`,
            transform: `translateX(${index * 100}%)`,
          }}
        />
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={cn(
                'relative z-10 h-8 rounded-lg text-xs font-semibold transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400',
                selected ? 'text-ink-900 dark:text-white' : 'text-ink-500 hover:text-ink-800 dark:text-ink-300 dark:hover:text-white',
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
