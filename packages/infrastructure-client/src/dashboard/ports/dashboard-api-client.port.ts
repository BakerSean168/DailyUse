/**
 * Dashboard API Client Port Interface
 *
 * Defines the contract for Dashboard API operations.
 * Implementations: DashboardHttpAdapter (web), DashboardIpcAdapter (desktop)
 */

import type {
  DashboardStatisticsClientDTO,
  DashboardConfigClientDTO,
} from '@dailyuse/contracts/dashboard';

/**
 * Dashboard API Client Interface
 */
export interface IDashboardApiClient {
  // ===== Statistics =====

  /** 获取仪表盘统计数据 */
  getStatistics(): Promise<DashboardStatisticsClientDTO>;

  /** 刷新仪表盘统计数据（强制重新计算） */
  refreshStatistics(): Promise<DashboardStatisticsClientDTO>;

  // ===== Config =====

  /** 获取仪表盘配置 */
  getConfig(): Promise<DashboardConfigClientDTO>;

  /** 更新仪表盘配置 */
  updateConfig(config: Partial<DashboardConfigClientDTO>): Promise<DashboardConfigClientDTO>;

  /** 重置仪表盘配置为默认 */
  resetConfig(): Promise<DashboardConfigClientDTO>;
}
