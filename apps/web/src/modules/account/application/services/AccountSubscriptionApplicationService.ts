/**
 * Account Subscription Application Service
 * 账户订阅应用服务 - 负责订阅相关的用例
 */

import type { AccountContracts } from '@dailyuse/contracts';
import { useAccountStore } from '../../presentation/stores/accountStore';
import { accountApiClient } from '../../infrastructure/api/accountApiClient';

export class AccountSubscriptionApplicationService {
  private static instance: AccountSubscriptionApplicationService;

  private constructor() {}

  /**
   * 创建应用服务实例
   */
  static createInstance(): AccountSubscriptionApplicationService {
    AccountSubscriptionApplicationService.instance =
      new AccountSubscriptionApplicationService();
    return AccountSubscriptionApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static getInstance(): AccountSubscriptionApplicationService {
    if (!AccountSubscriptionApplicationService.instance) {
      AccountSubscriptionApplicationService.instance =
        AccountSubscriptionApplicationService.createInstance();
    }
    return AccountSubscriptionApplicationService.instance;
  }

  /**
   * 懒加载获取 Account Store
   */
  private get accountStore(): ReturnType<typeof useAccountStore> {
    return useAccountStore();
  }

  // ============ 订阅管理用例 ============

  /**
   * 获取订阅信息
   */
  async getSubscription(accountId: string): Promise<AccountContracts.SubscriptionDTO> {
    try {
      this.accountStore.setLoading(true);
      const subscription = await accountApiClient.getSubscription(accountId);
      this.accountStore.setSubscription(subscription);
      return subscription;
    } catch (error) {
      console.error('Failed to get subscription:', error);
      throw error;
    } finally {
      this.accountStore.setLoading(false);
    }
  }

  /**
   * 订阅计划
   */
  async subscribePlan(
    accountId: string,
    request: AccountContracts.SubscribePlanRequestDTO,
  ): Promise<AccountContracts.SubscriptionDTO> {
    try {
      this.accountStore.setLoading(true);
      const subscription = await accountApiClient.subscribePlan(accountId, request);
      this.accountStore.setSubscription(subscription);

      // 订阅成功后刷新账户信息（订阅计划可能影响配额等）
      const updatedAccount = await accountApiClient.getAccountById(accountId);
      this.accountStore.setCurrentAccount(updatedAccount);

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe plan:', error);
      throw error;
    } finally {
      this.accountStore.setLoading(false);
    }
  }

  /**
   * 取消订阅
   */
  async cancelSubscription(
    accountId: string,
    request?: AccountContracts.CancelSubscriptionRequestDTO,
  ): Promise<AccountContracts.SubscriptionDTO> {
    try {
      this.accountStore.setLoading(true);
      const subscription = await accountApiClient.cancelSubscription(accountId, request);
      this.accountStore.setSubscription(subscription);

      // 取消订阅后刷新账户信息
      const updatedAccount = await accountApiClient.getAccountById(accountId);
      this.accountStore.setCurrentAccount(updatedAccount);

      return subscription;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    } finally {
      this.accountStore.setLoading(false);
    }
  }

  // ============ 账户统计查询用例 ============

  /**
   * 获取账户统计
   */
  async getAccountStats(): Promise<AccountContracts.AccountStatsResponseDTO> {
    try {
      this.accountStore.setLoading(true);
      const stats = await accountApiClient.getAccountStats();
      this.accountStore.setAccountStats(stats);
      return stats;
    } catch (error) {
      console.error('Failed to get account stats:', error);
      throw error;
    } finally {
      this.accountStore.setLoading(false);
    }
  }
}

// 导出单例
export const accountSubscriptionApplicationService =
  AccountSubscriptionApplicationService.getInstance();
