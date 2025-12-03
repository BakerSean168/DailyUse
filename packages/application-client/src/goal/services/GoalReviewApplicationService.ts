/**
 * Goal Review Application Service
 *
 * Handles GoalReview CRUD operations.
 * Framework-agnostic - can be used in Web or Desktop.
 */

import type { IGoalApiClient } from '@dailyuse/infrastructure-client';
import type {
  GoalReviewClientDTO,
  CreateGoalReviewRequest,
  GoalReviewsResponse,
} from '@dailyuse/contracts/goal';
import { eventBus } from '@dailyuse/utils';
import { GoalEvents, type GoalAggregateRefreshEvent } from '@dailyuse/contracts/goal';

/**
 * GoalReview Application Service
 */
export class GoalReviewApplicationService {
  constructor(private readonly goalApiClient: IGoalApiClient) {}

  /**
   * 创建目标复盘
   * @returns 返回创建的复盘 DTO
   */
  async createGoalReview(
    goalUuid: string,
    request: CreateGoalReviewRequest,
  ): Promise<GoalReviewClientDTO> {
    const data = await this.goalApiClient.createGoalReview(goalUuid, request);

    this.publishGoalRefreshEvent(goalUuid, 'goal-review-created', {
      reviewUuid: data.uuid,
    });

    return data;
  }

  /**
   * 获取目标的所有复盘
   * @returns 返回复盘列表
   */
  async getGoalReviewsByGoal(goalUuid: string): Promise<GoalReviewsResponse> {
    return this.goalApiClient.getGoalReviewsByGoal(goalUuid);
  }

  /**
   * 更新目标复盘
   * @returns 返回更新后的复盘 DTO
   */
  async updateGoalReview(
    goalUuid: string,
    reviewUuid: string,
    request: Partial<GoalReviewClientDTO>,
  ): Promise<GoalReviewClientDTO> {
    const data = await this.goalApiClient.updateGoalReview(goalUuid, reviewUuid, request);

    this.publishGoalRefreshEvent(goalUuid, 'goal-review-updated', {
      reviewUuid: reviewUuid,
    });

    return data;
  }

  /**
   * 删除目标复盘
   */
  async deleteGoalReview(goalUuid: string, reviewUuid: string): Promise<void> {
    await this.goalApiClient.deleteGoalReview(goalUuid, reviewUuid);

    this.publishGoalRefreshEvent(goalUuid, 'goal-review-deleted', {
      reviewUuid: reviewUuid,
    });
  }

  // ===== 辅助方法 =====

  /**
   * 发布 Goal 刷新事件
   */
  private publishGoalRefreshEvent(
    goalUuid: string,
    reason: 'goal-review-created' | 'goal-review-updated' | 'goal-review-deleted',
    metadata?: Record<string, unknown>,
  ): void {
    const event: GoalAggregateRefreshEvent = {
      goalUuid,
      reason,
      timestamp: Date.now(),
      metadata,
    };

    eventBus.emit(GoalEvents.AGGREGATE_REFRESH, event);
  }
}

/**
 * Factory function to create GoalReviewApplicationService
 */
export function createGoalReviewService(
  goalApiClient: IGoalApiClient,
): GoalReviewApplicationService {
  return new GoalReviewApplicationService(goalApiClient);
}
