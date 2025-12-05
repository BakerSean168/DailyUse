/**
 * Cancel Subscription
 *
 * 取消订阅用例
 */

import type { SubscriptionDTO, CancelSubscriptionRequestDTO } from '@dailyuse/contracts/account';
import type { IAccountApiClient } from '@dailyuse/infrastructure-client';
import { AccountContainer } from '@dailyuse/infrastructure-client';

/**
 * Cancel Subscription Input
 */
export interface CancelSubscriptionInput {
  accountId: string;
  request?: CancelSubscriptionRequestDTO;
}

/**
 * Cancel Subscription
 */
export class CancelSubscription {
  private static instance: CancelSubscription;

  private constructor(private readonly apiClient: IAccountApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAccountApiClient): CancelSubscription {
    const container = AccountContainer.getInstance();
    const client = apiClient || container.getApiClient();
    CancelSubscription.instance = new CancelSubscription(client);
    return CancelSubscription.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CancelSubscription {
    if (!CancelSubscription.instance) {
      CancelSubscription.instance = CancelSubscription.createInstance();
    }
    return CancelSubscription.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CancelSubscription.instance = undefined as unknown as CancelSubscription;
  }

  /**
   * 执行用例
   */
  async execute(input: CancelSubscriptionInput): Promise<SubscriptionDTO> {
    return this.apiClient.cancelSubscription(input.accountId, input.request);
  }
}

/**
 * 便捷函数
 */
export const cancelSubscription = (input: CancelSubscriptionInput): Promise<SubscriptionDTO> =>
  CancelSubscription.getInstance().execute(input);
