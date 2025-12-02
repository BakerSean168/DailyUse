/**
 * Goal Review Application Service
 * 目标复盘应用服务 - 负责 GoalReview 的 CRUD 和管理
 *
 * 🔄 重构说明（方案 A - 简化版）：
 * - ApplicationService 只负责 API 调用 + DTO → Entity 转换
 * - 不再直接依赖 Store，返回数据给调用方
 * - Store 操作由 Composable 层负责
 * - 这样确保无循环依赖，且 Service 可独立测试
 *
 * 📝 错误处理说明：
 * - axios 拦截器已处理 API 错误，success: false 会抛出 Error
 * - Service 直接抛出错误，由 Composable 层统一处理
 */

import type {
  GoalReviewClientDTO,
  CreateGoalReviewRequest,
  GoalReviewsResponse,
} from '@dailyuse/contracts/goal';
import { goalApiClient } from '../../infrastructure/api/goalApiClient';
import { eventBus, GoalEvents, type GoalAggregateRefreshEvent } from '@dailyuse/utils';

export class GoalReviewApplicationService {
  private static instance: GoalReviewApplicationService;

  private constructor() {}

  static getInstance(): GoalReviewApplicationService {
    if (!GoalReviewApplicationService.instance) {
      GoalReviewApplicationService.instance = new GoalReviewApplicationService();
    }
    return GoalReviewApplicationService.instance;
  }

  /**
   * 创建目标复盘
   * @returns 返回创建的复盘 DTO
   */
  async createGoalReview(
    goalUuid: string,
    request: CreateGoalReviewRequest,
  ): Promise<GoalReviewClientDTO> {
    const data = await goalApiClient.createGoalReview(goalUuid, request);

    // 发布事件通知 Goal 需要刷新
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
    return await goalApiClient.getGoalReviewsByGoal(goalUuid);
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
    const data = await goalApiClient.updateGoalReview(goalUuid, reviewUuid, request);

    // 发布事件通知 Goal 需要刷新
    this.publishGoalRefreshEvent(goalUuid, 'goal-review-updated', {
      reviewUuid: reviewUuid,
    });

    return data;
  }

  /**
   * 删除目标复盘
   */
  async deleteGoalReview(goalUuid: string, reviewUuid: string): Promise<void> {
    await goalApiClient.deleteGoalReview(goalUuid, reviewUuid);

    // 发布事件通知 Goal 需要刷新
    this.publishGoalRefreshEvent(goalUuid, 'goal-review-deleted', {
      reviewUuid: reviewUuid,
    });
  }

  // ===== 辅助方法 =====

  /**
   * 发布 Goal 刷新事件
   * @param goalUuid Goal UUID
   * @param reason 刷新原因
   * @param metadata 事件元数据
   */
  private publishGoalRefreshEvent(
    goalUuid: string,
    reason: 'goal-review-created' | 'goal-review-updated' | 'goal-review-deleted',
    metadata?: any,
  ): void {
    const event: GoalAggregateRefreshEvent = {
      goalUuid,
      reason,
      timestamp: Date.now(),
      metadata,
    };

    console.log('[GoalReviewApplicationService] 发布 Goal 刷新事件:', event);
    eventBus.emit(GoalEvents.AGGREGATE_REFRESH, event);
  }
}

export const goalReviewApplicationService = GoalReviewApplicationService.getInstance();

