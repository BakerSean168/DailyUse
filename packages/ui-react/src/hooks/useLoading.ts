import { useState, useCallback } from 'react';
import { createLoadingStore, type LoadingState } from '@dailyuse/ui-core';

export interface UseLoadingReturn {
  /** Whether loading is active */
  isLoading: boolean;
  /** Loading message */
  message: string | undefined;
  /** Current state */
  state: LoadingState;
  /** Start loading */
  start: (message?: string) => void;
  /** Stop loading */
  stop: () => void;
  /** Execute async operation with loading state */
  withLoading: <T>(fn: () => Promise<T>, message?: string) => Promise<T>;
}

/**
 * React hook for loading state management
 * Wraps @dailyuse/ui-core loading logic
 */
export function useLoading(initialMessage?: string): UseLoadingReturn {
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    message: initialMessage,
  });

  const store = createLoadingStore({
    getState: () => state,
    setState,
  });

  const start = useCallback((message?: string) => {
    setState({ isLoading: true, message });
  }, []);

  const stop = useCallback(() => {
    setState({ isLoading: false, message: undefined });
  }, []);

  const withLoading = useCallback(async <T>(fn: () => Promise<T>, message?: string): Promise<T> => {
    setState({ isLoading: true, message });
    try {
      return await fn();
    } finally {
      setState({ isLoading: false, message: undefined });
    }
  }, []);

  return {
    isLoading: state.isLoading,
    message: state.message,
    state,
    start,
    stop,
    withLoading,
  };
}
