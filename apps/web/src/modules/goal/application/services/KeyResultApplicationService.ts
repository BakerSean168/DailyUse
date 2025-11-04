import type { GoalContracts } from '@dailyuse/contracts';
import { goalApiClient } from '../../infrastructure/api/goalApiClient';
import { getGoalStore } from '../../presentation/stores/goalStore';
import { useSnackbar } from '@/shared/composables/useSnackbar';

/**
 * Key Result Application Service
 * 关键结果应用服务 - 负责 KeyResult 的 CRUD 和管理
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
    request: Omit<GoalContracts.AddKeyResultRequest, 'goalUuid'>,
  ): Promise<GoalContracts.KeyResultClientDTO> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const data = await goalApiClient.addKeyResultForGoal(goalUuid, request);

      // 更新关联的Goal实体（重新获取以包含新的KeyResult）
      await this.refreshGoalWithKeyResults(goalUuid);

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
  async getKeyResultsByGoal(goalUuid: string): Promise<GoalContracts.KeyResultsResponse> {
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
    request: GoalContracts.UpdateKeyResultRequest,
  ): Promise<GoalContracts.KeyResultClientDTO> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const data = await goalApiClient.updateKeyResultForGoal(goalUuid, keyResultUuid, request);

      // 更新关联的Goal实体
      await this.refreshGoalWithKeyResults(goalUuid);

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

      // 更新关联的Goal实体
      await this.refreshGoalWithKeyResults(goalUuid);

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
  ): Promise<GoalContracts.KeyResultsResponse> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const data = await goalApiClient.batchUpdateKeyResultWeights(goalUuid, request);

      // 更新关联的Goal实体
      await this.refreshGoalWithKeyResults(goalUuid);

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
  async getProgressBreakdown(goalUuid: string): Promise<GoalContracts.ProgressBreakdown> {
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
   * 刷新Goal及其KeyResults
   */
  private async refreshGoalWithKeyResults(goalUuid: string): Promise<void> {
    try {
      console.log('[KeyResultApplicationService] 开始刷新Goal及其KeyResults:', goalUuid);
      const { Goal } = await import('@dailyuse/domain-client');
      const goalResponse = await goalApiClient.getGoalById(goalUuid, true);
      console.log('[KeyResultApplicationService] 获取到Goal数据:', goalResponse);
      console.log('[KeyResultApplicationService] Goal包含的KeyResults:', goalResponse.keyResults?.length || 0);
      
      const goal = Goal.fromClientDTO(goalResponse);
      this.goalStore.addOrUpdateGoal(goal);
      
      console.log('[KeyResultApplicationService] Goal已更新到store');
    } catch (error) {
      console.warn('❌ 刷新Goal和KeyResults失败:', error);
    }
  }
}

export const keyResultApplicationService = KeyResultApplicationService.getInstance();
