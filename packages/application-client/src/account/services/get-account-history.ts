/**
 * Get Account History
 *
 * 获取账户历史用例
 */

import type { AccountHistoryListResponseDTO } from '@dailyuse/contracts/account';
import type { IAccountApiClient } from '@dailyuse/infrastructure-client';
import { AccountContainer } from '../AccountContainer';

/**
 * Get Account History Input
 */
export interface GetAccountHistoryInput {
  accountId: string;
  params?: {
    page?: number;
    limit?: number;
  };
}

/**
 * Get Account History
 */
export class GetAccountHistory {
  private static instance: GetAccountHistory;

  private constructor(private readonly apiClient: IAccountApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAccountApiClient): GetAccountHistory {
    const container = AccountContainer.getInstance();
    const client = apiClient || container.getAccountApiClient();
    GetAccountHistory.instance = new GetAccountHistory(client);
    return GetAccountHistory.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetAccountHistory {
    if (!GetAccountHistory.instance) {
      GetAccountHistory.instance = GetAccountHistory.createInstance();
    }
    return GetAccountHistory.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetAccountHistory.instance = undefined as unknown as GetAccountHistory;
  }

  /**
   * 执行用例
   */
  async execute(input: GetAccountHistoryInput): Promise<AccountHistoryListResponseDTO> {
    return this.apiClient.getAccountHistory(input.accountId, input.params);
  }
}

/**
 * 便捷函数
 */
export const getAccountHistory = (input: GetAccountHistoryInput): Promise<AccountHistoryListResponseDTO> =>
  GetAccountHistory.getInstance().execute(input);
