import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/format';
import { CloseIcon } from './icons';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  hideClose?: boolean;
}

export function Modal({ open, onClose, title, children, className, hideClose }: Props) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const focusTarget = panelRef.current?.querySelector<HTMLElement>('[data-autofocus]') ?? panelRef.current;
    focusTarget?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-ink-950/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          'relative w-full max-w-md animate-scale-in overflow-hidden rounded-3xl border border-white/10',
          'bg-ink-50 text-ink-900 shadow-2xl outline-none dark:bg-ink-800 dark:text-ink-50',
          className,
        )}
      >
        {!hideClose && (
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-xl text-ink-400 transition hover:bg-ink-900/5 hover:text-ink-700 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <CloseIcon />
          </button>
        )}
        {title && (
          <h2 id={titleId} className="sr-only">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
