/**
 * useDashboard Hook
 *
 * 仪表盘管理 Hook
 */

import { useState, useCallback, useEffect } from 'react';
import { dashboardApplicationService } from '../../application/services';
import type {
  DashboardStatisticsClientDTO,
  DashboardConfigClientDTO,
} from '@dailyuse/contracts/dashboard';
import type { UpdateDashboardConfigInput } from '@dailyuse/application-client';

// ===== Types =====

export interface DashboardState {
  statistics: DashboardStatisticsClientDTO | null;
  config: DashboardConfigClientDTO | null;
  loading: boolean;
  error: string | null;
}

export interface UseDashboardReturn extends DashboardState {
  // Statistics
  loadStatistics: () => Promise<void>;
  refreshStatistics: () => Promise<void>;

  // Config
  loadConfig: () => Promise<void>;
  updateConfig: (input: UpdateDashboardConfigInput) => Promise<DashboardConfigClientDTO>;
  resetConfig: () => Promise<void>;

  // Utilities
  clearError: () => void;
  refresh: () => Promise<void>;
}

// ===== Hook Implementation =====

export function useDashboard(): UseDashboardReturn {
  const [state, setState] = useState<DashboardState>({
    statistics: null,
    config: null,
    loading: false,
    error: null,
  });

  // ===== Statistics =====

  const loadStatistics = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const statistics = await dashboardApplicationService.getDashboardStatistics();
      setState((prev) => ({ ...prev, statistics, loading: false }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '加载仪表盘统计失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
    }
  }, []);

  const refreshStatistics = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const statistics = await dashboardApplicationService.refreshDashboardStatistics();
      setState((prev) => ({ ...prev, statistics, loading: false }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '刷新仪表盘统计失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
    }
  }, []);

  // ===== Config =====

  const loadConfig = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const config = await dashboardApplicationService.getDashboardConfig();
      setState((prev) => ({ ...prev, config, loading: false }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '加载仪表盘配置失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
    }
  }, []);

  const updateConfig = useCallback(async (input: UpdateDashboardConfigInput) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const config = await dashboardApplicationService.updateDashboardConfig(input);
      setState((prev) => ({ ...prev, config, loading: false }));
      return config;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '更新仪表盘配置失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw e;
    }
  }, []);

  const resetConfig = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const config = await dashboardApplicationService.resetDashboardConfig();
      setState((prev) => ({ ...prev, config, loading: false }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '重置仪表盘配置失败';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw e;
    }
  }, []);

  // ===== Utilities =====

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([loadStatistics(), loadConfig()]);
  }, [loadStatistics, loadConfig]);

  // ===== Effects =====

  useEffect(() => {
    loadStatistics();
    loadConfig();
  }, [loadStatistics, loadConfig]);

  return {
    ...state,
    loadStatistics,
    refreshStatistics,
    loadConfig,
    updateConfig,
    resetConfig,
    clearError,
    refresh,
  };
}
