/**
 * Get Account Stats
 *
 * 获取账户统计用例
 */

import type { AccountStatsResponseDTO } from '@dailyuse/contracts/account';
import type { IAccountApiClient } from '@dailyuse/infrastructure-client';
import { AccountContainer } from '@dailyuse/infrastructure-client';

/**
 * Get Account Stats
 */
export class GetAccountStats {
  private static instance: GetAccountStats;

  private constructor(private readonly apiClient: IAccountApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAccountApiClient): GetAccountStats {
    const container = AccountContainer.getInstance();
    const client = apiClient || container.getAccountApiClient();
    GetAccountStats.instance = new GetAccountStats(client);
    return GetAccountStats.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetAccountStats {
    if (!GetAccountStats.instance) {
      GetAccountStats.instance = GetAccountStats.createInstance();
    }
    return GetAccountStats.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetAccountStats.instance = undefined as unknown as GetAccountStats;
  }

  /**
   * 执行用例
   */
  async execute(): Promise<AccountStatsResponseDTO> {
    return this.apiClient.getAccountStats();
  }
}

/**
 * 便捷函数
 */
export const getAccountStats = (): Promise<AccountStatsResponseDTO> =>
  GetAccountStats.getInstance().execute();
