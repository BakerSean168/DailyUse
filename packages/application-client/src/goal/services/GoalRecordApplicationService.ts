/**
 * Goal Record Application Service
 *
 * Handles GoalRecord CRUD operations.
 * Framework-agnostic - can be used in Web or Desktop.
 *
 * 重要：创建/更新/删除 GoalRecord 会对 Goal 的进度造成影响，
 * 因此必须从服务器重新获取完整数据，不能使用乐观更新
 */

import type { IGoalApiClient } from '@dailyuse/infrastructure-client';
import type {
  GoalRecordClientDTO,
  CreateGoalRecordRequest,
  GoalRecordsResponse,
} from '@dailyuse/contracts/goal';
import { eventBus } from '@dailyuse/utils';
import { GoalEvents, type GoalAggregateRefreshEvent } from '@dailyuse/contracts/goal';

/**
 * GoalRecord Application Service
 */
export class GoalRecordApplicationService {
  constructor(private readonly goalApiClient: IGoalApiClient) {}

  /**
   * 创建目标记录
   * @returns 返回创建的记录 DTO
   */
  async createGoalRecord(
    goalUuid: string,
    keyResultUuid: string,
    request: CreateGoalRecordRequest,
  ): Promise<GoalRecordClientDTO> {
    const data = await this.goalApiClient.createGoalRecord(goalUuid, keyResultUuid, request);

    // 发布事件通知 Goal 需要刷新（创建 Record 会触发服务器端的进度计算）
    this.publishGoalRefreshEvent(goalUuid, 'goal-record-created', {
      keyResultUuid,
      goalRecordUuid: data.uuid,
    });

    return data;
  }

  /**
   * 获取关键结果的所有记录
   * @returns 返回记录列表
   */
  async getGoalRecordsByKeyResult(
    goalUuid: string,
    keyResultUuid: string,
    params?: {
      page?: number;
      limit?: number;
      dateRange?: { start?: string; end?: string };
    },
  ): Promise<GoalRecordsResponse> {
    return this.goalApiClient.getGoalRecordsByKeyResult(goalUuid, keyResultUuid, params);
  }

  /**
   * 获取目标的所有记录
   * @returns 返回记录列表
   */
  async getGoalRecordsByGoal(
    goalUuid: string,
    params?: {
      page?: number;
      limit?: number;
      dateRange?: { start?: string; end?: string };
    },
  ): Promise<GoalRecordsResponse> {
    return this.goalApiClient.getGoalRecordsByGoal(goalUuid, params);
  }

  /**
   * 删除目标记录
   */
  async deleteGoalRecord(
    goalUuid: string,
    keyResultUuid: string,
    recordUuid: string,
  ): Promise<void> {
    await this.goalApiClient.deleteGoalRecord(goalUuid, keyResultUuid, recordUuid);

    this.publishGoalRefreshEvent(goalUuid, 'goal-record-deleted', {
      keyResultUuid,
      goalRecordUuid: recordUuid,
    });
  }

  // ===== 辅助方法 =====

  /**
   * 发布 Goal 刷新事件
   */
  private publishGoalRefreshEvent(
    goalUuid: string,
    reason: 'goal-record-created' | 'goal-record-updated' | 'goal-record-deleted',
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
 * Factory function to create GoalRecordApplicationService
 */
export function createGoalRecordService(
  goalApiClient: IGoalApiClient,
): GoalRecordApplicationService {
  return new GoalRecordApplicationService(goalApiClient);
}
