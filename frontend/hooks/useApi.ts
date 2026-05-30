import { useState, useCallback } from 'react';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>(
  apiFn: (...args: any[]) => Promise<T>
): UseApiState<T> & { execute: (...args: any[]) => Promise<T | null> } {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: any[]) => {
      setState(s => ({ ...s, loading: true, error: null }));
      try {
        const result = await apiFn(...args);
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (err: any) {
        const message =
          err?.response?.data?.detail ??
          err?.message ??
          'Something went wrong';
        setState({ data: null, loading: false, error: message });
        return null;
      }
    },
    [apiFn]
  );

  return { ...state, execute };
}
