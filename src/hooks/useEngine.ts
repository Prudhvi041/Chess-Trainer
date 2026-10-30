import { useEffect, useRef } from 'react';
import { EngineClient } from '../engine/client';

/** One engine worker per component; terminated on unmount. */
export function useEngine(): EngineClient {
  const ref = useRef<EngineClient | null>(null);
  if (!ref.current) ref.current = new EngineClient();
  useEffect(() => () => ref.current?.cancel(), []);
  return ref.current;
}
