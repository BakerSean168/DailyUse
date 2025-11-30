import type { GoalClientDTO, KeyResultClientDTO, CreateGoalRequest, UpdateGoalRequest, AddKeyResultRequest, KeyResultsResponse, UpdateKeyResultRequest, ProgressBreakdown } from '@dailyuse/contracts/goal';
import { goalApiClient } from '../../infrastructure/api/goalApiClient';
import { getGoalStore } from '../../presentation/stores/goalStore';
import { useSnackbar } from '@/shared/composables/useSnackbar';
import { eventBus, GoalEvents, type GoalAggregateRefreshEvent } from '@dailyuse/utils';

/**
 * Key Result Application Service
 * 关键结果应用服务 - 负责 KeyResult 的 CRUD 和管理
 * 
 * 架构设计：
 * 1. 不再直接调用 refreshGoalWithKeyResults()
 * 2. 代之以发布 GoalAggregateRefreshEvent 事件
 * 3. GoalSyncApplicationService 监听此事件并自动刷新
 * 4. 完全解耦，便于维护和扩展
 */
export class KeyResultApplicationService {
  private static instance: KeyResultApplicationService;

  private constructor() {}

  /**
   * 延迟获取 Snackbar（避免在 Pinia 初始化前访问）
   */
  private get snackbar() {
    return useSnackbar();
  }

  static getInstance(): KeyResultApplicationService {
    if (!KeyResultApplicationService.instance) {
      KeyResultApplicationService.instance = new KeyResultApplicationService();
    }
    return KeyResultApplicationService.instance;
  }

  /**
   * 懒加载获取 Goal Store
   */
  private get goalStore() {
    return getGoalStore();
  }

  /**
   * 为目标创建关键结果
   */
  async createKeyResultForGoal(
    goalUuid: string,
    request: Omit<AddKeyResultRequest, 'goalUuid'>,
  ): Promise<KeyResultClientDTO> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const data = await goalApiClient.addKeyResultForGoal(goalUuid, request);

      // 发布事件通知 Goal 需要刷新
      this.publishGoalRefreshEvent(goalUuid, 'key-result-created', {
        keyResultUuid: data.uuid,
      });

      this.snackbar.showSuccess('关键结果创建成功');
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建关键结果失败';
      this.goalStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 获取目标的所有关键结果
   */
  async getKeyResultsByGoal(goalUuid: string): Promise<KeyResultsResponse> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const data = await goalApiClient.getKeyResultsByGoal(goalUuid);

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取关键结果列表失败';
      this.goalStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 更新关键结果
   */
  async updateKeyResultForGoal(
    goalUuid: string,
    keyResultUuid: string,
    request: UpdateKeyResultRequest,
  ): Promise<KeyResultClientDTO> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const data = await goalApiClient.updateKeyResultForGoal(goalUuid, keyResultUuid, request);

      // 发布事件通知 Goal 需要刷新
      this.publishGoalRefreshEvent(goalUuid, 'key-result-updated', {
        keyResultUuid: keyResultUuid,
      });

      this.snackbar.showSuccess('关键结果更新成功');
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新关键结果失败';
      this.goalStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 删除关键结果
   */
  async deleteKeyResultForGoal(goalUuid: string, keyResultUuid: string): Promise<void> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      await goalApiClient.deleteKeyResultForGoal(goalUuid, keyResultUuid);

      // 发布事件通知 Goal 需要刷新
      this.publishGoalRefreshEvent(goalUuid, 'key-result-deleted', {
        keyResultUuid: keyResultUuid,
      });

      this.snackbar.showSuccess('关键结果删除成功');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除关键结果失败';
      this.goalStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 批量更新关键结果权重
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
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const data = await goalApiClient.batchUpdateKeyResultWeights(goalUuid, request);

      // 发布事件通知 Goal 需要刷新
      this.publishGoalRefreshEvent(goalUuid, 'key-result-updated', {});

      this.snackbar.showSuccess('关键结果权重更新成功');
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '批量更新关键结果权重失败';
      this.goalStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 获取目标进度分解详情
   */
  async getProgressBreakdown(goalUuid: string): Promise<ProgressBreakdown> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const data = await goalApiClient.getProgressBreakdown(goalUuid);

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取进度详情失败';
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

