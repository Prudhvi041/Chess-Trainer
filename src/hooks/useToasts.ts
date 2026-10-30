import { useCallback, useEffect, useRef, useState } from 'react';

export interface Toast {
  id: number;
  title: string;
  description?: string;
  icon?: string;
  tone?: 'gold' | 'neutral';
}

export function useToasts(duration = 2400) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Set<number>());

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = nextId.current++;
      setToasts((t) => [...t.slice(-2), { ...toast, id }]);
      const timer = window.setTimeout(() => {
        timers.current.delete(timer);
        dismiss(id);
      }, duration);
      timers.current.add(timer);
    },
    [dismiss, duration],
  );

  useEffect(() => {
    const active = timers.current;
    return () => active.forEach((t) => window.clearTimeout(t));
  }, []);

  return { toasts, push, dismiss };
}
