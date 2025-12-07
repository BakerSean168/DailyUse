/**
 * useDashboard Hook
 *
 * 提供仪表盘数据获取的优化 hook
 * 使用 dashboard:get-all 批量获取数据，减少 IPC 调用次数
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// ============ Types ============

export interface DashboardStats {
  goals: {
    total: number;
    active: number;
    completed: number;
    paused: number;
    overdue: number;
  };
  tasks: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
  schedules: {
    total: number;
    active: number;
    paused: number;
    todayCount: number;
  };
  reminders: {
    total: number;
    enabled: number;
    todayCount: number;
  };
}

export interface DashboardData {
  stats: DashboardStats | null;
  activeGoals: any[];
  todayTasks: any[];
  todaySchedules: any[];
  upcomingReminders: any[];
  lastUpdated: Date | null;
}

export interface UseDashboardOptions {
  /** 自动刷新间隔（毫秒），0 表示禁用 */
  autoRefreshInterval?: number;
  /** 是否在挂载时自动加载 */
  loadOnMount?: boolean;
}

export interface UseDashboardResult extends DashboardData {
  loading: boolean;
  error: string | null;
  /** 刷新数据 */
  refresh: () => Promise<void>;
  /** 是否启用自动刷新 */
  autoRefreshEnabled: boolean;
  /** 切换自动刷新 */
  toggleAutoRefresh: () => void;
}

// ============ Constants ============

const DEFAULT_AUTO_REFRESH_INTERVAL = 60000; // 1 minute

// ============ Hook ============

/**
 * Dashboard 数据获取 hook
 *
 * @example
 * ```tsx
 * const {
 *   stats,
 *   activeGoals,
 *   todayTasks,
 *   loading,
 *   refresh,
 * } = useDashboard({ autoRefreshInterval: 60000 });
 * ```
 */
export function useDashboard(
  options: UseDashboardOptions = {}
): UseDashboardResult {
  const {
    autoRefreshInterval = DEFAULT_AUTO_REFRESH_INTERVAL,
    loadOnMount = true,
  } = options;

  // State
  const [data, setData] = useState<DashboardData>({
    stats: null,
    activeGoals: [],
    todayTasks: [],
    todaySchedules: [],
    upcomingReminders: [],
    lastUpdated: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(
    autoRefreshInterval > 0
  );

  // Refs
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ============ Data Loading ============

  interface DashboardAllResponse {
    stats: DashboardStats;
    activeGoals: any[];
    todayTasks: any[];
    todaySchedules: any[];
    upcomingReminders: any[];
    timestamp: number;
  }

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 使用批量 API 获取所有数据
      const result = await window.electronAPI.invoke('dashboard:get-all') as DashboardAllResponse;

      setData({
        stats: result.stats,
        activeGoals: result.activeGoals || [],
        todayTasks: result.todayTasks || [],
        todaySchedules: result.todaySchedules || [],
        upcomingReminders: result.upcomingReminders || [],
        lastUpdated: new Date(result.timestamp),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载仪表盘数据失败';
      setError(message);
      console.error('[useDashboard] Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ============ Auto Refresh ============

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled((prev) => !prev);
  }, []);

  // Setup auto refresh
  useEffect(() => {
    if (autoRefreshEnabled && autoRefreshInterval > 0) {
      refreshIntervalRef.current = setInterval(refresh, autoRefreshInterval);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [autoRefreshEnabled, autoRefreshInterval, refresh]);

  // Load on mount
  useEffect(() => {
    if (loadOnMount) {
      refresh();
    }
  }, [loadOnMount, refresh]);

  return {
    ...data,
    loading,
    error,
    refresh,
    autoRefreshEnabled,
    toggleAutoRefresh,
  };
}

export default useDashboard;
