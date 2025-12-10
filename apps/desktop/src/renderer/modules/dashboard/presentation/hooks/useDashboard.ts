/**
 * useDashboard Hook
 *
 * Provides a hook for fetching all dashboard-related data in a single optimized IPC call.
 * Reduces IPC overhead by aggregating stats, goals, tasks, schedules, and reminders.
 * Supports auto-refreshing at a configurable interval.
 *
 * @module renderer/modules/dashboard/presentation/hooks/useDashboard
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// ============ Types ============

/**
 * Aggregated statistics structure.
 */
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

/**
 * Complete set of data returned for the dashboard view.
 */
export interface DashboardData {
  /** Aggregated statistics. */
  stats: DashboardStats | null;
  /** List of active goals. */
  activeGoals: any[]; // Replace 'any' with concrete Goal type if available
  /** List of tasks due today. */
  todayTasks: any[]; // Replace 'any' with concrete Task type
  /** List of schedule events for today. */
  todaySchedules: any[]; // Replace 'any' with concrete Schedule type
  /** List of upcoming reminders. */
  upcomingReminders: any[]; // Replace 'any' with concrete Reminder type
  /** Timestamp of the last successful data update. */
  lastUpdated: Date | null;
}

/**
 * Options for configuring the hook.
 */
export interface UseDashboardOptions {
  /** Interval in milliseconds to auto-refresh data. 0 disables auto-refresh. */
  autoRefreshInterval?: number;
  /** Whether to trigger a fetch immediately on component mount. Defaults to true. */
  loadOnMount?: boolean;
}

/**
 * Result returned by the useDashboard hook.
 */
export interface UseDashboardResult extends DashboardData {
  /** Loading state. */
  loading: boolean;
  /** Error message if fetch failed. */
  error: string | null;
  /** Function to manually trigger a refresh. */
  refresh: () => Promise<void>;
  /** Whether auto-refresh is currently enabled. */
  autoRefreshEnabled: boolean;
  /** Function to toggle auto-refresh on/off. */
  toggleAutoRefresh: () => void;
}

// ============ Constants ============

const DEFAULT_AUTO_REFRESH_INTERVAL = 60000; // 1 minute

// ============ Hook ============

/**
 * Hook to fetch dashboard data.
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
 *
 * @param {UseDashboardOptions} [options] - Configuration options.
 * @returns {UseDashboardResult} Dashboard data and control functions.
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

      // Fetch all data in a single batch IPC call
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
      const message = err instanceof Error ? err.message : 'Failed to load dashboard data';
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

  // Setup auto refresh interval
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

  // Initial load
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
