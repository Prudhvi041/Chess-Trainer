import { cn } from '../../lib/format';

interface Props {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export function Toggle({ label, description, checked, onChange, disabled, icon }: Props) {
  return (
    <label className={cn('flex cursor-pointer items-center gap-3', disabled && 'cursor-not-allowed opacity-60')}>
      {icon && (
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ink-900/[0.05] text-ink-500 dark:bg-white/5 dark:text-ink-200">
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink-700 dark:text-ink-100">{label}</span>
        {description && <span className="block text-xs text-ink-400">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-ink-800',
          checked ? 'bg-gold-400' : 'bg-ink-200 dark:bg-ink-600',
        )}
      >
        <span
          className={cn(
            'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ease-[cubic-bezier(.2,.9,.3,1.3)]',
            checked && 'translate-x-5',
          )}
        />
      </button>
    </label>
  );
}
