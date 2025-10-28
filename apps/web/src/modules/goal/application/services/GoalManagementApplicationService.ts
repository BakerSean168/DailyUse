import type { GoalContracts } from '@dailyuse/contracts';
import { GoalClient } from '@dailyuse/domain-client';
import { goalApiClient } from '../../infrastructure/api/goalApiClient';
import { getGoalStore } from '../../presentation/stores/goalStore';
import { useSnackbar } from '@/shared/composables/useSnackbar';

/**
 * Goal Management Application Service
 * 目标管理应用服务 - 负责目标的 CRUD 和状态管理
 */
export class GoalManagementApplicationService {
  private static instance: GoalManagementApplicationService;

  private constructor() {}

  /**
   * 延迟获取 Snackbar（避免在 Pinia 初始化前访问）
   */
  private get snackbar() {
    return useSnackbar();
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GoalManagementApplicationService {
    if (!GoalManagementApplicationService.instance) {
      GoalManagementApplicationService.instance = new GoalManagementApplicationService();
    }
    return GoalManagementApplicationService.instance;
  }

  /**
   * 懒加载获取 Goal Store
   */
  private get goalStore() {
    return getGoalStore();
  }

  // ===== Goal CRUD 操作 =====

  /**
   * 创建目标
   */
  async createGoal(request: GoalContracts.CreateGoalRequest): Promise<GoalContracts.GoalClientDTO> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const goalData = await goalApiClient.createGoal(request);

      // 创建客户端实体并同步到 store
      const goal = GoalClient.fromClientDTO(goalData);
      this.goalStore.addOrUpdateGoal(goal);

      this.snackbar.showSuccess('目标创建成功');
      return goalData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建目标失败';
      this.goalStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 获取目标列表
   */
  async getGoals(params?: {
    page?: number;
    limit?: number;
    status?: string;
    dirUuid?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<GoalContracts.GoalsResponse> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const goalsData = await goalApiClient.getGoals(params);

      // 批量创建客户端实体并同步到 store
      const goals = (goalsData.data || []).map((goalData: any) => GoalClient.fromClientDTO(goalData));
      this.goalStore.setGoals(goals);

      // 更新分页信息
      this.goalStore.setPagination({
        page: goalsData.page,
        limit: goalsData.limit,
        total: goalsData.total,
      });

      return goalsData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取目标列表失败';
      this.goalStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 根据 UUID 获取目标详情
   */
  async getGoalById(uuid: string): Promise<GoalContracts.GoalClientDTO | null> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const data = await goalApiClient.getGoalById(uuid);

      // 创建客户端实体并同步到 store
      const goal = GoalClient.fromClientDTO(data);
      this.goalStore.addOrUpdateGoal(goal);

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取目标详情失败';
      this.goalStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 更新目标
   */
  async updateGoal(
    uuid: string,
    request: GoalContracts.UpdateGoalRequest,
  ): Promise<GoalContracts.GoalClientDTO> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const data = await goalApiClient.updateGoal(uuid, request);

      // 更新客户端实体并同步到 store
      const goal = GoalClient.fromClientDTO(data);
      this.goalStore.addOrUpdateGoal(goal);

      this.snackbar.showSuccess('目标更新成功');
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新目标失败';
      this.goalStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 删除目标
   */
  async deleteGoal(uuid: string): Promise<void> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      await goalApiClient.deleteGoal(uuid);

      // 从 store 中移除
      this.goalStore.removeGoal(uuid);

      this.snackbar.showSuccess('目标删除成功');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除目标失败';
      this.goalStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  // ===== Goal 状态管理 =====

  /**
   * 激活目标
   */
  async activateGoal(uuid: string): Promise<GoalContracts.GoalClientDTO> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const data = await goalApiClient.activateGoal(uuid);

      // 更新客户端实体并同步到 store
      const goal = GoalClient.fromClientDTO(data);
      this.goalStore.addOrUpdateGoal(goal);

      this.snackbar.showSuccess('目标已激活');
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '激活目标失败';
      this.goalStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 暂停目标
   */
  async pauseGoal(uuid: string): Promise<GoalContracts.GoalClientDTO> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const data = await goalApiClient.pauseGoal(uuid);

      // 更新客户端实体并同步到 store
      const goal = GoalClient.fromClientDTO(data);
      this.goalStore.addOrUpdateGoal(goal);

      this.snackbar.showSuccess('目标已暂停');
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '暂停目标失败';
      this.goalStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 完成目标
   */
  async completeGoal(uuid: string): Promise<GoalContracts.GoalClientDTO> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const data = await goalApiClient.completeGoal(uuid);

      // 更新客户端实体并同步到 store
      const goal = GoalClient.fromClientDTO(data);
      this.goalStore.addOrUpdateGoal(goal);

      this.snackbar.showSuccess('目标已完成');
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '完成目标失败';
      this.goalStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 归档目标
   */
  async archiveGoal(uuid: string): Promise<GoalContracts.GoalClientDTO> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const data = await goalApiClient.archiveGoal(uuid);

      // 更新客户端实体并同步到 store
      const goal = GoalClient.fromClientDTO(data);
      this.goalStore.addOrUpdateGoal(goal);

      this.snackbar.showSuccess('目标已归档');
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '归档目标失败';
      this.goalStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 搜索目标
   */
  async searchGoals(params: {
    keywords?: string;
    status?: string;
    dirUuid?: string;
    page?: number;
    limit?: number;
  }): Promise<GoalContracts.GoalsResponse> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const response = await goalApiClient.searchGoals(params);

      // 批量创建客户端实体并同步到 store
      const goals = (response.data || []).map((goalData: any) => GoalClient.fromClientDTO(goalData));
      this.goalStore.setGoals(goals);

      // 更新分页信息
      this.goalStore.setPagination({
        page: response.page,
        limit: response.limit,
        total: response.total,
      });

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '搜索目标失败';
      this.goalStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }
}

// 导出单例获取函数
export const goalManagementApplicationService = GoalManagementApplicationService.getInstance();
