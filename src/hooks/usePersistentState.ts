import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { readStorage, writeStorage } from '../lib/storage';

/** useState that is mirrored to localStorage under a namespaced key. */
export function usePersistentState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    const stored = readStorage<T>(key, initial);
    // Merge objects so new fields added in later versions get defaults.
    return isPlainObject(initial) && isPlainObject(stored) ? { ...initial, ...stored } : stored;
  });

  useEffect(() => writeStorage(key, value), [key, value]);

  const set = useCallback<Dispatch<SetStateAction<T>>>((next) => setValue(next), []);
  return [value, set];
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
