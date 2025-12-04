/**
 * Subscribe Plan
 *
 * 订阅计划用例
 */

import type { SubscriptionDTO, SubscribePlanRequestDTO } from '@dailyuse/contracts/account';
import type { IAccountApiClient } from '@dailyuse/infrastructure-client';
import { AccountContainer } from '../AccountContainer';

/**
 * Subscribe Plan Input
 */
export interface SubscribePlanInput {
  accountId: string;
  request: SubscribePlanRequestDTO;
}

/**
 * Subscribe Plan
 */
export class SubscribePlan {
  private static instance: SubscribePlan;

  private constructor(private readonly apiClient: IAccountApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAccountApiClient): SubscribePlan {
    const container = AccountContainer.getInstance();
    const client = apiClient || container.getAccountApiClient();
    SubscribePlan.instance = new SubscribePlan(client);
    return SubscribePlan.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): SubscribePlan {
    if (!SubscribePlan.instance) {
      SubscribePlan.instance = SubscribePlan.createInstance();
    }
    return SubscribePlan.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    SubscribePlan.instance = undefined as unknown as SubscribePlan;
  }

  /**
   * 执行用例
   */
  async execute(input: SubscribePlanInput): Promise<SubscriptionDTO> {
    return this.apiClient.subscribePlan(input.accountId, input.request);
  }
}

/**
 * 便捷函数
 */
export const subscribePlan = (input: SubscribePlanInput): Promise<SubscriptionDTO> =>
  SubscribePlan.getInstance().execute(input);
