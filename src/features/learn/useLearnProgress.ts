import { useCallback, useMemo } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';
import { ALL_LESSONS } from '../../learn/curriculum';

interface Progress {
  completed: string[];
}

export function useLearnProgress() {
  const [progress, setProgress] = usePersistentState<Progress>('learn', { completed: [] });

  const completed = useMemo(() => new Set(progress.completed), [progress.completed]);

  const markComplete = useCallback(
    (id: string) =>
      setProgress((p) => (p.completed.includes(id) ? p : { ...p, completed: [...p.completed, id] })),
    [setProgress],
  );

  const reset = useCallback(() => setProgress({ completed: [] }), [setProgress]);

  /** First lesson not yet completed (or null when the course is done). */
  const nextUp = useMemo(() => ALL_LESSONS.find((l) => !completed.has(l.id))?.id ?? null, [completed]);

  return {
    completed,
    completedCount: ALL_LESSONS.filter((l) => completed.has(l.id)).length,
    total: ALL_LESSONS.length,
    nextUp,
    markComplete,
    reset,
  };
}
