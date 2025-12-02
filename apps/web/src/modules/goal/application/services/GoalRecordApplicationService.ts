/**
 * Goal Record Application Service
 * 目标记录应用服务 - 负责 GoalRecord 的 CRUD 和管理
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
 *
 * 重要：创建/更新/删除 GoalRecord 会对 Goal 的进度造成影响，
 * 因此必须从服务器重新获取完整数据，不能使用乐观更新
 */

import type {
  GoalRecordClientDTO,
  CreateGoalRecordRequest,
  GoalRecordsResponse,
} from '@dailyuse/contracts/goal';
import { goalApiClient } from '../../infrastructure/api/goalApiClient';
import { eventBus, GoalEvents, type GoalAggregateRefreshEvent } from '@dailyuse/utils';

export class GoalRecordApplicationService {
  private static instance: GoalRecordApplicationService;

  private constructor() {}

  static getInstance(): GoalRecordApplicationService {
    if (!GoalRecordApplicationService.instance) {
      GoalRecordApplicationService.instance = new GoalRecordApplicationService();
    }
    return GoalRecordApplicationService.instance;
  }

  /**
   * 创建目标记录
   * @returns 返回创建的记录 DTO
   * 注意：创建记录会触发副作用（更新 KeyResult 和 Goal 的进度），因此不适合乐观更新
   */
  async createGoalRecord(
    goalUuid: string,
    keyResultUuid: string,
    request: CreateGoalRecordRequest,
  ): Promise<GoalRecordClientDTO> {
    console.log('[GoalRecordApplicationService] 创建 Record:', {
      goalUuid,
      keyResultUuid,
      request,
    });

    const data = await goalApiClient.createGoalRecord(goalUuid, keyResultUuid, request);

    console.log('[GoalRecordApplicationService] Record 创建成功:', data);

    // 发布事件通知 Goal 需要刷新
    // 这是必需的，因为创建 Record 会触发服务器端的进度计算
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
    return await goalApiClient.getGoalRecordsByKeyResult(goalUuid, keyResultUuid, params);
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
    return await goalApiClient.getGoalRecordsByGoal(goalUuid, params);
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
    reason: 'goal-record-created' | 'goal-record-updated' | 'goal-record-deleted',
    metadata?: any,
  ): void {
    const event: GoalAggregateRefreshEvent = {
      goalUuid,
      reason,
      timestamp: Date.now(),
      metadata,
    };

    console.log('[GoalRecordApplicationService] 发布 Goal 刷新事件:', event);
    eventBus.emit(GoalEvents.AGGREGATE_REFRESH, event);
  }
}

export const goalRecordApplicationService = GoalRecordApplicationService.getInstance();

