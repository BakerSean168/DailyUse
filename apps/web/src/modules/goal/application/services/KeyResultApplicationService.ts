/**
 * Key Result Application Service
 * 关键结果应用服务 - 负责 KeyResult 的 CRUD 和管理
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
 *
 * 架构设计：
 * 1. 不再直接调用 refreshGoalWithKeyResults()
 * 2. 代之以发布 GoalAggregateRefreshEvent 事件
 * 3. GoalSyncApplicationService 监听此事件并自动刷新
 * 4. 完全解耦，便于维护和扩展
 */

import type {
  KeyResultClientDTO,
  AddKeyResultRequest,
  KeyResultsResponse,
  UpdateKeyResultRequest,
  ProgressBreakdown,
} from '@dailyuse/contracts/goal';
import { goalApiClient } from '../../infrastructure/api/goalApiClient';
import { eventBus } from '@dailyuse/utils';
import { GoalEvents, type GoalAggregateRefreshEvent } from '@dailyuse/contracts/goal';

export class KeyResultApplicationService {
  private static instance: KeyResultApplicationService;

  private constructor() {}

  static getInstance(): KeyResultApplicationService {
    if (!KeyResultApplicationService.instance) {
      KeyResultApplicationService.instance = new KeyResultApplicationService();
    }
    return KeyResultApplicationService.instance;
  }

  /**
   * 为目标创建关键结果
   * @returns 返回创建的 KeyResult DTO
   */
  async createKeyResultForGoal(
    goalUuid: string,
    request: Omit<AddKeyResultRequest, 'goalUuid'>,
  ): Promise<KeyResultClientDTO> {
    const data = await goalApiClient.addKeyResultForGoal(goalUuid, request);

    // 发布事件通知 Goal 需要刷新
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
    return await goalApiClient.getKeyResultsByGoal(goalUuid);
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
    const data = await goalApiClient.updateKeyResultForGoal(goalUuid, keyResultUuid, request);

    // 发布事件通知 Goal 需要刷新
    this.publishGoalRefreshEvent(goalUuid, 'key-result-updated', {
      keyResultUuid: keyResultUuid,
    });

    return data;
  }

  /**
   * 删除关键结果
   */
  async deleteKeyResultForGoal(goalUuid: string, keyResultUuid: string): Promise<void> {
    await goalApiClient.deleteKeyResultForGoal(goalUuid, keyResultUuid);

    // 发布事件通知 Goal 需要刷新
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
    const data = await goalApiClient.batchUpdateKeyResultWeights(goalUuid, request);

    // 发布事件通知 Goal 需要刷新
    this.publishGoalRefreshEvent(goalUuid, 'key-result-updated', {});

    return data;
  }

  /**
   * 获取目标进度分解详情
   * @returns 返回进度分解数据
   */
  async getProgressBreakdown(goalUuid: string): Promise<ProgressBreakdown> {
    return await goalApiClient.getProgressBreakdown(goalUuid);
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
    keyResults: any[];
    tokenUsage: any;
    generatedAt: number;
  }> {
    return await goalApiClient.generateKeyResults(request);
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
    reason: 'key-result-created' | 'key-result-updated' | 'key-result-deleted',
    metadata?: any,
  ): void {
    const event: GoalAggregateRefreshEvent = {
      goalUuid,
      reason,
      timestamp: Date.now(),
      metadata,
    };

    console.log('[KeyResultApplicationService] 发布 Goal 刷新事件:', event);
    eventBus.emit(GoalEvents.AGGREGATE_REFRESH, event);
  }
}

export const keyResultApplicationService = KeyResultApplicationService.getInstance();

