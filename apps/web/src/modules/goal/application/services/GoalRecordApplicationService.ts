import type { GoalClientDTO, KeyResultClientDTO, CreateGoalRequest, UpdateGoalRequest } from '@dailyuse/contracts/goal';
import { Goal } from '@dailyuse/domain-client';
import { goalApiClient } from '../../infrastructure/api/goalApiClient';
import { getGoalStore } from '../../presentation/stores/goalStore';
import { useSnackbar } from '@/shared/composables/useSnackbar';
import { eventBus, GoalEvents, type GoalAggregateRefreshEvent } from '@dailyuse/utils';

/**
 * Goal Record Application Service
 * 目标记录应用服务 - 负责 GoalRecord 的 CRUD 和管理
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
export class GoalRecordApplicationService {
  private static instance: GoalRecordApplicationService;

  private constructor() {}

  /**
   * 延迟获取 Snackbar（避免在 Pinia 初始化前访问）
   */
  private get snackbar() {
    return useSnackbar();
  }

  static getInstance(): GoalRecordApplicationService {
    if (!GoalRecordApplicationService.instance) {
      GoalRecordApplicationService.instance = new GoalRecordApplicationService();
    }
    return GoalRecordApplicationService.instance;
  }

  /**
   * 懒加载获取 Goal Store
   */
  private get goalStore() {
    return getGoalStore();
  }

  /**
   * 创建目标记录
   * 注意：创建记录会触发副作用（更新 KeyResult 和 Goal 的进度），因此不适合乐观更新
   */
  async createGoalRecord(
    goalUuid: string,
    keyResultUuid: string,
    request: CreateGoalRecordRequest,
  ): Promise<GoalRecordClientDTO> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      console.log('[GoalRecordApplicationService] 创建 Record:', { goalUuid, keyResultUuid, request });

      // 1. 创建记录
      const data = await goalApiClient.createGoalRecord(goalUuid, keyResultUuid, request);
      
      console.log('[GoalRecordApplicationService] Record 创建成功:', data);

      // 2. 发布事件通知 Goal 需要刷新
      // 这是必需的，因为创建 Record 会触发服务器端的进度计算
      this.publishGoalRefreshEvent(goalUuid, 'goal-record-created', {
        keyResultUuid,
        goalRecordUuid: data.uuid,
      });

      // 显示成功提示
      this.snackbar.showSuccess('目标记录创建成功');

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建目标记录失败';
      this.goalStore.setError(errorMessage);

      // 显示错误提示
      this.snackbar.showError(errorMessage);

      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 获取关键结果的所有记录
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
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const data = await goalApiClient.getGoalRecordsByKeyResult(goalUuid, keyResultUuid, params);

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取目标记录失败';
      this.goalStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 获取目标的所有记录
   */
  async getGoalRecordsByGoal(
    goalUuid: string,
    params?: {
      page?: number;
      limit?: number;
      dateRange?: { start?: string; end?: string };
    },
  ): Promise<GoalRecordsResponse> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const data = await goalApiClient.getGoalRecordsByGoal(goalUuid, params);

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取目标记录失败';
      this.goalStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
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

