/**
 * Get Goal Reviews
 *
 * 获取目标的所有复盘用例
 */

import type { IGoalApiClient } from '@dailyuse/infrastructure-client';
import type { GoalReviewsResponse } from '@dailyuse/contracts/goal';
import { GoalContainer } from '@dailyuse/infrastructure-client';

/**
 * Get Goal Reviews
 */
export class GetGoalReviews {
  private static instance: GetGoalReviews;

  private constructor(private readonly apiClient: IGoalApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IGoalApiClient): GetGoalReviews {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getGoalApiClient();
    GetGoalReviews.instance = new GetGoalReviews(client);
    return GetGoalReviews.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetGoalReviews {
    if (!GetGoalReviews.instance) {
      GetGoalReviews.instance = GetGoalReviews.createInstance();
    }
    return GetGoalReviews.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetGoalReviews.instance = undefined as unknown as GetGoalReviews;
  }

  /**
   * 执行用例
   */
  async execute(goalUuid: string): Promise<GoalReviewsResponse> {
    return this.apiClient.getGoalReviewsByGoal(goalUuid);
  }
}

/**
 * 便捷函数
 */
export const getGoalReviews = (goalUuid: string): Promise<GoalReviewsResponse> =>
  GetGoalReviews.getInstance().execute(goalUuid);
