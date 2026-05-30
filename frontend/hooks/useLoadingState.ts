import { useState, useCallback } from 'react';

interface UseLoadingStateReturn<T> {
  data: T | null;
  loadState: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
  execute: (fn: () => Promise<T>) => Promise<void>;
  reset: () => void;
}

export function useLoadingState<T>(initialData?: T): UseLoadingStateReturn<T> {
  const [data, setData] = useState<T | null>(initialData ?? null);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (fn: () => Promise<T>) => {
    setLoadState('loading');
    setError(null);
    try {
      const result = await fn();
      setData(result);
      setLoadState('success');
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong');
      setLoadState('error');
    }
  }, []);

  const reset = useCallback(() => {
    setData(initialData ?? null);
    setLoadState('idle');
    setError(null);
  }, [initialData]);

  return { data, loadState, error, execute, reset };
}
