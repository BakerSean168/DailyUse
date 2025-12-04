/**
 * Account Subscription Application Service
 *
 * 账户订阅应用服务 - 负责订阅相关的用例
 */

import type {
  SubscriptionDTO,
  SubscribePlanRequestDTO,
  CancelSubscriptionRequestDTO,
  AccountStatsResponseDTO,
} from '@dailyuse/contracts/account';
import type { IAccountApiClient } from '@dailyuse/infrastructure-client/ports';

/**
 * Account Subscription Application Service
 */
export class AccountSubscriptionApplicationService {
  constructor(private readonly apiClient: IAccountApiClient) {}

  // ===== 订阅管理用例 =====

  /**
   * 获取订阅信息
   */
  async getSubscription(accountId: string): Promise<SubscriptionDTO> {
    return this.apiClient.getSubscription(accountId);
  }

  /**
   * 订阅计划
   */
  async subscribePlan(
    accountId: string,
    request: SubscribePlanRequestDTO,
  ): Promise<SubscriptionDTO> {
    return this.apiClient.subscribePlan(accountId, request);
  }

  /**
   * 取消订阅
   */
  async cancelSubscription(
    accountId: string,
    request?: CancelSubscriptionRequestDTO,
  ): Promise<SubscriptionDTO> {
    return this.apiClient.cancelSubscription(accountId, request);
  }

  // ===== 账户统计查询用例 =====

  /**
   * 获取账户统计
   */
  async getAccountStats(): Promise<AccountStatsResponseDTO> {
    return this.apiClient.getAccountStats();
  }
}

/**
 * Factory function to create AccountSubscriptionApplicationService
 */
export function createAccountSubscriptionApplicationService(
  apiClient: IAccountApiClient,
): AccountSubscriptionApplicationService {
  return new AccountSubscriptionApplicationService(apiClient);
}
