/**
 * Get Dashboard Statistics
 *
 * 获取仪表盘统计数据用例
 */

import type { IDashboardApiClient } from '@dailyuse/infrastructure-client';
import type { DashboardStatisticsClientDTO } from '@dailyuse/contracts/dashboard';
import { DashboardContainer } from '@dailyuse/infrastructure-client';

/**
 * Get Dashboard Statistics
 */
export class GetDashboardStatistics {
  private static instance: GetDashboardStatistics;

  private constructor(private readonly apiClient: IDashboardApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IDashboardApiClient): GetDashboardStatistics {
    const container = DashboardContainer.getInstance();
    const client = apiClient || container.getApiClient();
    GetDashboardStatistics.instance = new GetDashboardStatistics(client);
    return GetDashboardStatistics.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetDashboardStatistics {
    if (!GetDashboardStatistics.instance) {
      GetDashboardStatistics.instance = GetDashboardStatistics.createInstance();
    }
    return GetDashboardStatistics.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetDashboardStatistics.instance = undefined as unknown as GetDashboardStatistics;
  }

  /**
   * 执行用例
   */
  async execute(): Promise<DashboardStatisticsClientDTO> {
    return this.apiClient.getStatistics();
  }
}

/**
 * 便捷函数
 */
export const getDashboardStatistics = (): Promise<DashboardStatisticsClientDTO> =>
  GetDashboardStatistics.getInstance().execute();
