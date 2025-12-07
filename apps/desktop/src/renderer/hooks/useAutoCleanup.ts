/**
 * useAutoCleanup Hook
 *
 * 自动清理 Hook - 组件卸载时自动清理数据
 * 防止内存泄漏，优化路由切换时的内存占用
 */

import { useState, useEffect, useCallback, useRef, type DependencyList } from 'react';

// ============ Types ============

export interface UseAutoCleanupOptions<T> {
  /** 数据获取函数 */
  fetcher: () => Promise<T>;
  /** 依赖项 */
  deps?: DependencyList;
  /** 是否立即加载 */
  loadOnMount?: boolean;
  /** 自定义清理函数 */
  onCleanup?: () => void;
  /** 卸载延迟清理时间 (ms)，0 表示立即清理 */
  cleanupDelay?: number;
}

export interface UseAutoCleanupResult<T> {
  /** 数据 */
  data: T | null;
  /** 是否加载中 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 刷新数据 */
  refresh: () => Promise<void>;
  /** 手动清理 */
  cleanup: () => void;
}

// ============ Hook ============

/**
 * 自动清理数据的 Hook
 *
 * @example
 * ```tsx
 * function GoalDetailView({ goalId }: { goalId: string }) {
 *   const { data: goal, loading, error } = useAutoCleanup({
 *     fetcher: () => goalApi.getGoal(goalId),
 *     deps: [goalId],
 *   });
 *
 *   // 当组件卸载或 goalId 变化时，旧数据会被自动清理
 *   if (loading) return <Skeleton />;
 *   if (!goal) return null;
 *   return <GoalDetail goal={goal} />;
 * }
 * ```
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

      // 只在组件仍然挂载时更新状态
      if (isMountedRef.current) {
        setData(result);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const message = err instanceof Error ? err.message : '加载失败';
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

  // 加载数据
  useEffect(() => {
    isMountedRef.current = true;

    // 清除之前的清理定时器
    if (cleanupTimerRef.current) {
      clearTimeout(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
    }

    if (loadOnMount) {
      load();
    }

    // 卸载时清理
    return () => {
      isMountedRef.current = false;

      if (cleanupDelay > 0) {
        // 延迟清理，给动画等留出时间
        cleanupTimerRef.current = setTimeout(() => {
          cleanup();
        }, cleanupDelay);
      } else {
        // 立即清理
        cleanup();
      }
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

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
 * 路由变化时清理状态的 Hook
 * 用于全局状态管理器或 Context
 */
export function useCleanupOnRouteChange(
  cleanupFn: () => void,
  pathname: string
): void {
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      // 路由变化，执行清理
      cleanupFn();
      prevPathnameRef.current = pathname;
    }
  }, [pathname, cleanupFn]);
}

// ============ WeakMap based cache ============

/**
 * 使用 WeakMap 的缓存，允许自动垃圾回收
 * 当 key 对象被回收时，对应的缓存值也会被回收
 */
export class WeakCache<K extends object, V> {
  private cache = new WeakMap<K, V>();

  get(key: K): V | undefined {
    return this.cache.get(key);
  }

  set(key: K, value: V): void {
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * 获取或创建缓存值
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
