/**
 * useInfiniteLoad Hook
 *
 * 无限滚动加载 Hook
 * 支持分页数据的增量加载
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// ============ Types ============

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

export interface UseInfiniteLoadOptions<T, P = Record<string, unknown>> {
  /** 数据获取函数 */
  fetcher: (params: P & { page: number; pageSize: number }) => Promise<PaginatedResponse<T>>;
  /** 额外的过滤参数 */
  params?: P;
  /** 每页数量 */
  pageSize?: number;
  /** 是否立即加载 */
  loadOnMount?: boolean;
  /** 获取项目唯一标识 */
  getItemKey: (item: T) => string | number;
}

export interface UseInfiniteLoadResult<T> {
  /** 所有已加载的数据 */
  items: T[];
  /** 是否正在加载 */
  loading: boolean;
  /** 是否正在加载更多 */
  loadingMore: boolean;
  /** 错误信息 */
  error: string | null;
  /** 分页信息 */
  pagination: PaginationInfo | null;
  /** 是否有更多数据 */
  hasMore: boolean;
  /** 加载更多 */
  loadMore: () => Promise<void>;
  /** 刷新 (重新加载第一页) */
  refresh: () => Promise<void>;
  /** 重置 */
  reset: () => void;
}

// ============ Constants ============

const DEFAULT_PAGE_SIZE = 20;

// ============ Hook ============

/**
 * 无限滚动加载 Hook
 *
 * @example
 * ```tsx
 * const {
 *   items,
 *   loading,
 *   loadingMore,
 *   hasMore,
 *   loadMore,
 *   refresh,
 * } = useInfiniteLoad({
 *   fetcher: (params) => goalApiClient.getGoals(params),
 *   getItemKey: (goal) => goal.uuid,
 *   pageSize: 20,
 * });
 *
 * return (
 *   <VirtualList
 *     items={items}
 *     onEndReached={loadMore}
 *     renderItem={(goal) => <GoalCard goal={goal} />}
 *   />
 * );
 * ```
 */
export function useInfiniteLoad<T, P = Record<string, unknown>>(
  options: UseInfiniteLoadOptions<T, P>
): UseInfiniteLoadResult<T> {
  const {
    fetcher,
    params,
    pageSize = DEFAULT_PAGE_SIZE,
    loadOnMount = true,
    getItemKey,
  } = options;

  // State
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  // Refs
  const currentPageRef = useRef(0);
  const loadingRef = useRef(false);
  const seenKeysRef = useRef(new Set<string | number>());

  // ============ Load Functions ============

  const loadPage = useCallback(
    async (page: number, isRefresh: boolean = false) => {
      if (loadingRef.current) return;

      try {
        loadingRef.current = true;
        if (isRefresh || page === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError(null);

        const response = await fetcher({
          ...params,
          page,
          pageSize,
        } as P & { page: number; pageSize: number });

        // 去重处理
        const newItems = response.data.filter((item) => {
          const key = getItemKey(item);
          if (seenKeysRef.current.has(key)) {
            return false;
          }
          seenKeysRef.current.add(key);
          return true;
        });

        if (isRefresh || page === 1) {
          seenKeysRef.current = new Set(response.data.map(getItemKey));
          setItems(response.data);
        } else {
          setItems((prev) => [...prev, ...newItems]);
        }

        setPagination(response.pagination);
        currentPageRef.current = page;
      } catch (err) {
        const message = err instanceof Error ? err.message : '加载失败';
        setError(message);
        console.error('[useInfiniteLoad] Failed to load:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        loadingRef.current = false;
      }
    },
    [fetcher, params, pageSize, getItemKey]
  );

  const loadMore = useCallback(async () => {
    if (!pagination?.hasNext || loadingRef.current) return;
    await loadPage(currentPageRef.current + 1);
  }, [pagination?.hasNext, loadPage]);

  const refresh = useCallback(async () => {
    seenKeysRef.current.clear();
    currentPageRef.current = 0;
    await loadPage(1, true);
  }, [loadPage]);

  const reset = useCallback(() => {
    setItems([]);
    setPagination(null);
    setError(null);
    setLoading(false);
    setLoadingMore(false);
    seenKeysRef.current.clear();
    currentPageRef.current = 0;
  }, []);

  // ============ Effects ============

  // Load on mount
  useEffect(() => {
    if (loadOnMount) {
      loadPage(1, true);
    }
  }, [loadOnMount]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload when params change
  useEffect(() => {
    if (loadOnMount && currentPageRef.current > 0) {
      refresh();
    }
  }, [JSON.stringify(params)]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    items,
    loading,
    loadingMore,
    error,
    pagination,
    hasMore: pagination?.hasNext ?? false,
    loadMore,
    refresh,
    reset,
  };
}

export default useInfiniteLoad;
