/**
 * Refresh Dashboard Statistics
 *
 * 刷新仪表盘统计数据用例（强制重新计算）
 */

import type { IDashboardApiClient } from '@dailyuse/infrastructure-client';
import type { DashboardStatisticsClientDTO } from '@dailyuse/contracts/dashboard';
import { DashboardContainer } from '@dailyuse/infrastructure-client';

/**
 * Refresh Dashboard Statistics
 */
export class RefreshDashboardStatistics {
  private static instance: RefreshDashboardStatistics;

  private constructor(private readonly apiClient: IDashboardApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IDashboardApiClient): RefreshDashboardStatistics {
    const container = DashboardContainer.getInstance();
    const client = apiClient || container.getApiClient();
    RefreshDashboardStatistics.instance = new RefreshDashboardStatistics(client);
    return RefreshDashboardStatistics.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): RefreshDashboardStatistics {
    if (!RefreshDashboardStatistics.instance) {
      RefreshDashboardStatistics.instance = RefreshDashboardStatistics.createInstance();
    }
    return RefreshDashboardStatistics.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    RefreshDashboardStatistics.instance = undefined as unknown as RefreshDashboardStatistics;
  }

  /**
   * 执行用例
   */
  async execute(): Promise<DashboardStatisticsClientDTO> {
    return this.apiClient.refreshStatistics();
  }
}

/**
 * 便捷函数
 */
export const refreshDashboardStatistics = (): Promise<DashboardStatisticsClientDTO> =>
  RefreshDashboardStatistics.getInstance().execute();
