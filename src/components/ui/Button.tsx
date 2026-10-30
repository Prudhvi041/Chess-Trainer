import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/format';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-gradient-to-b from-gold-300 to-gold-500 text-ink-900 shadow-[0_8px_24px_-8px_rgba(190,145,42,0.7)] hover:from-gold-200 hover:to-gold-400 ring-1 ring-inset ring-white/30',
  secondary:
    'bg-ink-900 text-ink-50 hover:bg-ink-700 dark:bg-white/10 dark:text-ink-50 dark:hover:bg-white/15 ring-1 ring-inset ring-white/5',
  ghost: 'text-ink-600 hover:bg-ink-900/5 dark:text-ink-200 dark:hover:bg-white/10',
  danger: 'bg-rose-600/10 text-rose-600 hover:bg-rose-600/20 dark:text-rose-400',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150',
        'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
        size === 'sm' && 'h-8 px-3 text-xs',
        size === 'md' && 'h-10 px-4 text-sm',
        size === 'lg' && 'h-12 px-6 text-base',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    />
  );
});

export function IconButton({
  label,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        'grid h-10 w-10 place-items-center rounded-xl text-ink-600 transition-colors',
        'hover:bg-ink-900/5 dark:text-ink-200 dark:hover:bg-white/10',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400',
        className,
      )}
      {...rest}
    />
  );
}
