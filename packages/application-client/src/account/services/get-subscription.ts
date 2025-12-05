/**
 * Get Subscription
 *
 * 获取订阅信息用例
 */

import type { SubscriptionDTO } from '@dailyuse/contracts/account';
import type { IAccountApiClient } from '@dailyuse/infrastructure-client';
import { AccountContainer } from '@dailyuse/infrastructure-client';

/**
 * Get Subscription
 */
export class GetSubscription {
  private static instance: GetSubscription;

  private constructor(private readonly apiClient: IAccountApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAccountApiClient): GetSubscription {
    const container = AccountContainer.getInstance();
    const client = apiClient || container.getApiClient();
    GetSubscription.instance = new GetSubscription(client);
    return GetSubscription.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetSubscription {
    if (!GetSubscription.instance) {
      GetSubscription.instance = GetSubscription.createInstance();
    }
    return GetSubscription.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetSubscription.instance = undefined as unknown as GetSubscription;
  }

  /**
   * 执行用例
   */
  async execute(accountId: string): Promise<SubscriptionDTO> {
    return this.apiClient.getSubscription(accountId);
  }
}

/**
 * 便捷函数
 */
export const getSubscription = (accountId: string): Promise<SubscriptionDTO> =>
  GetSubscription.getInstance().execute(accountId);
