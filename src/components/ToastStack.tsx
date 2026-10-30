import type { Toast } from '../hooks/useToasts';
import { cn } from '../lib/format';

export function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4 sm:top-5"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex animate-slide-down items-center gap-3 rounded-2xl px-4 py-2.5 shadow-xl backdrop-blur-xl',
            t.tone === 'gold'
              ? 'bg-gradient-to-b from-gold-200/95 to-gold-400/95 text-ink-900 ring-1 ring-white/40'
              : 'bg-ink-900/90 text-white ring-1 ring-white/10 dark:bg-ink-700/90',
          )}
        >
          {t.icon && <span className="text-xl leading-none">{t.icon}</span>}
          <div>
            <div className="text-sm font-semibold">{t.title}</div>
            {t.description && <div className="text-xs opacity-75">{t.description}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
