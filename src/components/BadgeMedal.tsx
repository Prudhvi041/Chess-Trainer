import type { Badge } from '../lib/badges';
import { cn } from '../lib/format';

interface Props {
  badge: Badge;
  unlocked: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function BadgeMedal({ badge, unlocked, size = 'md' }: Props) {
  const dims = size === 'lg' ? 'h-20 w-20 text-4xl' : size === 'sm' ? 'h-10 w-10 text-xl' : 'h-14 w-14 text-2xl';
  return (
    <span
      role="img"
      aria-label={`${badge.name} badge${unlocked ? '' : ' (locked)'}`}
      className={cn(
        'relative grid shrink-0 place-items-center rounded-full ring-4 transition-all duration-500',
        dims,
        unlocked
          ? cn('bg-gradient-to-br shadow-lg', badge.gradient, badge.ring)
          : 'bg-ink-200 ring-ink-200/40 dark:bg-ink-700 dark:ring-white/5',
      )}
    >
      {unlocked && (
        <span
          aria-hidden
          className="absolute inset-0 animate-shimmer rounded-full bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.45)_50%,transparent_70%)] bg-[length:200%_100%]"
        />
      )}
      <span
        aria-hidden
        className={cn(
          'relative leading-none',
          unlocked ? 'text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]' : 'text-ink-400 dark:text-ink-500',
        )}
      >
        {badge.glyph}
      </span>
    </span>
  );
}
