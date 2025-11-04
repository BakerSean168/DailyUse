import type { GoalContracts } from '@dailyuse/contracts';
import { Goal } from '@dailyuse/domain-client';
import { goalApiClient } from '../../infrastructure/api/goalApiClient';
import { getGoalStore } from '../../presentation/stores/goalStore';
import { useSnackbar } from '@/shared/composables/useSnackbar';

/**
 * Goal Record Application Service
 * 目标记录应用服务 - 负责 GoalRecord 的 CRUD 和管理
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
   */
  async createGoalRecord(
    goalUuid: string,
    keyResultUuid: string,
    request: GoalContracts.CreateGoalRecordRequest,
  ): Promise<GoalContracts.GoalRecordClientDTO> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const data = await goalApiClient.createGoalRecord(goalUuid, keyResultUuid, request);

      // 创建记录后更新关键结果进度和Goal状态
      await this.refreshGoalWithKeyResults(goalUuid);

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
  ): Promise<GoalContracts.GoalRecordsResponse> {
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
  ): Promise<GoalContracts.GoalRecordsResponse> {
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
   * 刷新Goal及其KeyResults
   */
  private async refreshGoalWithKeyResults(goalUuid: string): Promise<void> {
    try {
      console.log('[GoalRecordApplicationService] 开始刷新Goal及其KeyResults:', goalUuid);
      const goalResponse = await goalApiClient.getGoalById(goalUuid, true);
      console.log('[GoalRecordApplicationService] 获取到Goal数据:', goalResponse);
      console.log('[GoalRecordApplicationService] Goal包含的KeyResults:', goalResponse.keyResults?.length || 0);
      
      const goal = Goal.fromClientDTO(goalResponse);
      this.goalStore.addOrUpdateGoal(goal);
      
      console.log('[GoalRecordApplicationService] Goal已更新到store');
    } catch (error) {
      console.warn('❌ 刷新Goal和KeyResults失败:', error);
    }
  }
}

export const goalRecordApplicationService = GoalRecordApplicationService.getInstance();
