/**
 * useAutoCleanup Hook
 *
 * A custom hook to fetch data and automatically clean it up when the component unmounts or dependencies change.
 * This helps preventing memory leaks and managing data freshness, especially during route transitions.
 *
 * @module renderer/shared/hooks/useAutoCleanup
 */

import { useState, useEffect, useCallback, useRef, type DependencyList } from 'react';

// ============ Types ============

/**
 * Options for the useAutoCleanup hook.
 *
 * @template T The type of data being fetched.
 */
export interface UseAutoCleanupOptions<T> {
  /** Async function to fetch the data. */
  fetcher: () => Promise<T>;
  /** Dependency list that triggers a re-fetch when changed. Defaults to []. */
  deps?: DependencyList;
  /** Whether to trigger the fetch immediately on mount. Defaults to true. */
  loadOnMount?: boolean;
  /** Optional callback to run during cleanup phase. */
  onCleanup?: () => void;
  /** Delay in milliseconds before cleaning up data after unmount (useful for animations). 0 means immediate. */
  cleanupDelay?: number;
}

/**
 * Result object returned by the useAutoCleanup hook.
 *
 * @template T The type of data.
 */
export interface UseAutoCleanupResult<T> {
  /** The fetched data, or null if loading/error/cleaned up. */
  data: T | null;
  /** Whether the fetcher is currently running. */
  loading: boolean;
  /** Error message if the fetch failed. */
  error: string | null;
  /** Function to manually trigger a re-fetch. */
  refresh: () => Promise<void>;
  /** Function to manually trigger cleanup. */
  cleanup: () => void;
}

// ============ Hook ============

/**
 * Hook for managing data fetching with automatic cleanup lifecycle.
 *
 * @example
 * ```tsx
 * function GoalDetailView({ goalId }: { goalId: string }) {
 *   const { data: goal, loading, error } = useAutoCleanup({
 *     fetcher: () => goalApi.getGoal(goalId),
 *     deps: [goalId],
 *   });
 *
 *   if (loading) return <Skeleton />;
 *   if (!goal) return null;
 *   return <GoalDetail goal={goal} />;
 * }
 * ```
 *
 * @template T The data type.
 * @param {UseAutoCleanupOptions<T>} options - Configuration options.
 * @returns {UseAutoCleanupResult<T>} The data state and control functions.
 */
export function useAutoCleanup<T>(
  options: UseAutoCleanupOptions<T>
): UseAutoCleanupResult<T> {
  const {
    fetcher,
    deps = [],
    loadOnMount = true,
    onCleanup,
    cleanupDelay = 0,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    setData(null);
    setError(null);
    onCleanup?.();
  }, [onCleanup]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await fetcher();

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setData(result);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const message = err instanceof Error ? err.message : 'Failed to load data';
        setError(message);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetcher]);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  // Effect to handle data loading and cleanup
  useEffect(() => {
    isMountedRef.current = true;

    // Clear any pending delayed cleanup
    if (cleanupTimerRef.current) {
      clearTimeout(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
    }

    if (loadOnMount) {
      load();
    }

    // Cleanup function
    return () => {
      isMountedRef.current = false;

      if (cleanupDelay > 0) {
        // Schedule cleanup if delay is requested
        cleanupTimerRef.current = setTimeout(() => {
          cleanup();
        }, cleanupDelay);
      } else {
        // Immediate cleanup
        cleanup();
      }
    };
  }, deps);

  return {
    data,
    loading,
    error,
    refresh,
    cleanup,
  };
}

// ============ Companion Hook: useCleanupOnRouteChange ============

/**
 * Hook to trigger cleanup actions when the route pathname changes.
 * Useful for resetting global state stores or contexts that persist across components but should reset on navigation.
 *
 * @param {() => void} cleanupFn - The function to execute on route change.
 * @param {string} pathname - The current route pathname (usually from `useLocation`).
 */
export function useCleanupOnRouteChange(
  cleanupFn: () => void,
  pathname: string
): void {
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      // Route changed, run cleanup
      cleanupFn();
      prevPathnameRef.current = pathname;
    }
  }, [pathname, cleanupFn]);
}

// ============ WeakMap based cache ============

/**
 * A simple cache implementation using `WeakMap`.
 * Entries are automatically garbage collected when the key object is no longer referenced elsewhere.
 *
 * @template K Key type (must be an object).
 * @template V Value type.
 */
export class WeakCache<K extends object, V> {
  private cache = new WeakMap<K, V>();

  /**
   * Retrieves a value from the cache.
   * @param {K} key - The key object.
   * @returns {V | undefined} The cached value.
   */
  get(key: K): V | undefined {
    return this.cache.get(key);
  }

  /**
   * Stores a value in the cache.
   * @param {K} key - The key object.
   * @param {V} value - The value to cache.
   */
  set(key: K, value: V): void {
    this.cache.set(key, value);
  }

  /**
   * Checks if a key exists in the cache.
   * @param {K} key - The key object.
   * @returns {boolean} True if the key exists.
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * Removes a key from the cache.
   * @param {K} key - The key object.
   * @returns {boolean} True if an element existed and has been removed.
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Retrieves a value or creates it using the factory function if it doesn't exist.
   * @param {K} key - The key object.
   * @param {() => V} factory - Function to create the value if missing.
   * @returns {V} The cached or newly created value.
   */
  getOrCreate(key: K, factory: () => V): V {
    const existing = this.cache.get(key);
    if (existing !== undefined) {
      return existing;
    }
    const value = factory();
    this.cache.set(key, value);
    return value;
  }
}

export default useAutoCleanup;
