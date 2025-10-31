/**
 * API请求相关的组合式API
 * 提供通用的API请求状态管理
 */

import { ref, computed, type Ref } from 'vue';
import type { RequestOptions } from '../core/types';

/**
 * 请求状态接口
 */
interface RequestState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * 请求选项
 */
interface UseRequestOptions extends RequestOptions {
  immediate?: boolean; // 是否立即执行
  resetOnExecute?: boolean; // 执行时是否重置状态
}

/**
 * 通用请求Hook
 */
export function useRequest<T = any>(
  requestFn: (...args: any[]) => Promise<T>,
  options: UseRequestOptions = {},
) {
  const { immediate = false, resetOnExecute = true, ...requestOptions } = options;

  const state = ref<RequestState<T>>({
    data: null,
    loading: false,
    error: null,
  }) as Ref<RequestState<T>>;

  // 计算属性
  const isLoading = computed(() => state.value.loading);
  const isError = computed(() => !!state.value.error);
  const isSuccess = computed(
    () => !state.value.loading && !state.value.error && state.value.data !== null,
  );

  /**
   * 执行请求
   */
  const execute = async (...args: any[]): Promise<T | null> => {
    try {
      if (resetOnExecute) {
        state.value.error = null;
      }

      state.value.loading = true;

      const result = await requestFn(...args);
      state.value.data = result;

      return result;
    } catch (err: any) {
      state.value.error = err.message || '请求失败';
      throw err;
    } finally {
      state.value.loading = false;
    }
  };

  /**
   * 重置状态
   */
  const reset = () => {
    state.value = {
      data: null,
      loading: false,
      error: null,
    };
  };

  /**
   * 清除错误
   */
  const clearError = () => {
    state.value.error = null;
  };

  // 如果需要立即执行
  if (immediate) {
    execute();
  }

  return {
    // 状态
    data: computed(() => state.value.data),
    loading: isLoading,
    error: computed(() => state.value.error),
    isLoading,
    isError,
    isSuccess,

    // 方法
    execute,
    reset,
    clearError,
  };
}

/**
 * 分页请求Hook
 */
export function usePagination<T = any>(
  requestFn: (
    page: number,
    limit: number,
    ...args: any[]
  ) => Promise<{ items: T[]; total: number; [key: string]: any }>,
  options: { defaultPageSize?: number; immediate?: boolean } = {},
) {
  const { defaultPageSize = 10, immediate = true } = options;

  const page = ref(1);
  const pageSize = ref(defaultPageSize);
  const total = ref(0);
  const items = ref<T[]>([]) as Ref<T[]>;

  const { loading, error, execute, clearError } = useRequest(
    async (...args: any[]) => {
      const result = await requestFn(page.value, pageSize.value, ...args);
      items.value = result.items;
      total.value = result.total;
      return result;
    },
    { immediate: false },
  );

  // 计算属性
  const totalPages = computed(() => Math.ceil(total.value / pageSize.value));
  const hasNext = computed(() => page.value < totalPages.value);
  const hasPrev = computed(() => page.value > 1);

  /**
   * 跳转到指定页
   */
  const goToPage = async (targetPage: number, ...args: any[]) => {
    if (targetPage < 1 || targetPage > totalPages.value) return;

    page.value = targetPage;
    return execute(...args);
  };

  /**
   * 下一页
   */
  const nextPage = async (...args: any[]) => {
    if (hasNext.value) {
      return goToPage(page.value + 1, ...args);
    }
    return undefined;
  };

  /**
   * 上一页
   */
  const prevPage = async (...args: any[]) => {
    if (hasPrev.value) {
      return goToPage(page.value - 1, ...args);
    }
    return undefined;
  };

  /**
   * 刷新当前页
   */
  const refresh = async (...args: any[]) => {
    return execute(...args);
  };

  /**
   * 重置到第一页
   */
  const reset = async (...args: any[]) => {
    page.value = 1;
    return execute(...args);
  };

  /**
   * 改变页面大小
   */
  const changePageSize = async (newSize: number, ...args: any[]) => {
    pageSize.value = newSize;
    page.value = 1; // 重置到第一页
    return execute(...args);
  };

  // 如果需要立即执行
  if (immediate) {
    execute();
  }

  return {
    // 状态
    items,
    loading,
    error,
    page,
    pageSize,
    total,
    totalPages,
    hasNext,
    hasPrev,

    // 方法
    goToPage,
    nextPage,
    prevPage,
    refresh,
    reset,
    changePageSize,
    clearError,
  };
}

/**
 * 无限滚动Hook
 */
export function useInfiniteScroll<T = any>(
  requestFn: (
    page: number,
    limit: number,
    ...args: any[]
  ) => Promise<{ items: T[]; hasMore: boolean; [key: string]: any }>,
  options: { pageSize?: number; immediate?: boolean } = {},
) {
  const { pageSize = 10, immediate = true } = options;

  const page = ref(1);
  const items = ref<T[]>([]) as Ref<T[]>;
  const hasMore = ref(true);

  const { loading, error, execute, clearError } = useRequest(
    async (reset = false, ...args: any[]) => {
      const currentPage = reset ? 1 : page.value;
      const result = await requestFn(currentPage, pageSize, ...args);

      if (reset) {
        items.value = result.items;
        page.value = 1;
      } else {
        items.value.push(...result.items);
      }

      hasMore.value = result.hasMore;

      if (result.hasMore) {
        page.value++;
      }

      return result;
    },
    { immediate: false },
  );

  /**
   * 加载更多
   */
  const loadMore = async (...args: any[]) => {
    if (!hasMore.value || loading.value) return;
    return execute(false, ...args);
  };

  /**
   * 重置并重新加载
   */
  const reset = async (...args: any[]) => {
    page.value = 1;
    hasMore.value = true;
    return execute(true, ...args);
  };

  // 如果需要立即执行
  if (immediate) {
    execute(true);
  }

  return {
    // 状态
    items,
    loading,
    error,
    hasMore,

    // 方法
    loadMore,
    reset,
    clearError,
  };
}
