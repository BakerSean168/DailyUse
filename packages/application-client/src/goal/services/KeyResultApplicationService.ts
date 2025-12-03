/**
 * Key Result Application Service
 *
 * Handles KeyResult CRUD operations.
 * Framework-agnostic - can be used in Web or Desktop.
 *
 * 架构设计：
 * 1. 发布 GoalAggregateRefreshEvent 事件通知数据变更
 * 2. 上层（Composable/Store）监听事件并刷新数据
 * 3. 完全解耦，便于维护和扩展
 */

import type { IGoalApiClient } from '@dailyuse/infrastructure-client';
import type {
  KeyResultClientDTO,
  AddKeyResultRequest,
  KeyResultsResponse,
  UpdateKeyResultRequest,
  ProgressBreakdown,
} from '@dailyuse/contracts/goal';
import { eventBus } from '@dailyuse/utils';
import { GoalEvents, type GoalAggregateRefreshEvent } from '@dailyuse/contracts/goal';

/**
 * KeyResult Application Service
 */
export class KeyResultApplicationService {
  constructor(private readonly goalApiClient: IGoalApiClient) {}

  /**
   * 为目标创建关键结果
   * @returns 返回创建的 KeyResult DTO
   */
  async createKeyResultForGoal(
    goalUuid: string,
    request: Omit<AddKeyResultRequest, 'goalUuid'>,
  ): Promise<KeyResultClientDTO> {
    const data = await this.goalApiClient.addKeyResultForGoal(goalUuid, request);

    this.publishGoalRefreshEvent(goalUuid, 'key-result-created', {
      keyResultUuid: data.uuid,
    });

    return data;
  }

  /**
   * 获取目标的所有关键结果
   * @returns 返回 KeyResults 列表
   */
  async getKeyResultsByGoal(goalUuid: string): Promise<KeyResultsResponse> {
    return this.goalApiClient.getKeyResultsByGoal(goalUuid);
  }

  /**
   * 更新关键结果
   * @returns 返回更新后的 KeyResult DTO
   */
  async updateKeyResultForGoal(
    goalUuid: string,
    keyResultUuid: string,
    request: UpdateKeyResultRequest,
  ): Promise<KeyResultClientDTO> {
    const data = await this.goalApiClient.updateKeyResultForGoal(goalUuid, keyResultUuid, request);

    this.publishGoalRefreshEvent(goalUuid, 'key-result-updated', {
      keyResultUuid: keyResultUuid,
    });

    return data;
  }

  /**
   * 删除关键结果
   */
  async deleteKeyResultForGoal(goalUuid: string, keyResultUuid: string): Promise<void> {
    await this.goalApiClient.deleteKeyResultForGoal(goalUuid, keyResultUuid);

    this.publishGoalRefreshEvent(goalUuid, 'key-result-deleted', {
      keyResultUuid: keyResultUuid,
    });
  }

  /**
   * 批量更新关键结果权重
   * @returns 返回更新后的 KeyResults 列表
   */
  async batchUpdateKeyResultWeights(
    goalUuid: string,
    request: {
      updates: Array<{
        keyResultUuid: string;
        weight: number;
      }>;
    },
  ): Promise<KeyResultsResponse> {
    const data = await this.goalApiClient.batchUpdateKeyResultWeights(goalUuid, request);

    this.publishGoalRefreshEvent(goalUuid, 'key-result-updated', {});

    return data;
  }

  /**
   * 获取目标进度分解详情
   * @returns 返回进度分解数据
   */
  async getProgressBreakdown(goalUuid: string): Promise<ProgressBreakdown> {
    return this.goalApiClient.getProgressBreakdown(goalUuid);
  }

  /**
   * AI 生成关键结果
   * @returns 返回生成的关键结果列表和元数据
   */
  async generateKeyResults(request: {
    goalTitle: string;
    goalDescription?: string;
    startDate: number;
    endDate: number;
    goalContext?: string;
  }): Promise<{
    keyResults: Array<{
      title: string;
      description?: string;
      targetValue?: number;
      unit?: string;
    }>;
    tokenUsage: unknown;
    generatedAt: number;
  }> {
    return this.goalApiClient.generateKeyResults(request);
  }

  // ===== 辅助方法 =====

  /**
   * 发布 Goal 刷新事件
   */
  private publishGoalRefreshEvent(
    goalUuid: string,
    reason: 'key-result-created' | 'key-result-updated' | 'key-result-deleted',
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
 * Factory function to create KeyResultApplicationService
 */
export function createKeyResultService(
  goalApiClient: IGoalApiClient,
): KeyResultApplicationService {
  return new KeyResultApplicationService(goalApiClient);
}
