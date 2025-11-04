import type { GoalContracts } from '@dailyuse/contracts';
import { Goal } from '@dailyuse/domain-client';
import { goalApiClient } from '../../infrastructure/api/goalApiClient';
import { getGoalStore } from '../../presentation/stores/goalStore';
import { useSnackbar } from '@/shared/composables/useSnackbar';

/**
 * Goal Management Application Service
 * 目标管理应用服务 - 负责目标的 CRUD 和状态管理
 * 
 * 职责边界：
 * - Goal CRUD 操作
 * - Goal 状态管理（激活、暂停、完成、归档）
 * - Goal 搜索
 * 
 * 不负责：
 * - KeyResult 管理 → KeyResultApplicationService
 * - GoalRecord 管理 → GoalRecordApplicationService
 * - GoalReview 管理 → GoalReviewApplicationService
 * - GoalFolder 管理 → GoalFolderApplicationService
 * - 数据同步 → GoalSyncApplicationService
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
      const goal = Goal.fromClientDTO(goalData);
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

      // ✅ 确保 includeChildren=true 以获取 KeyResults
      const goalsData = await goalApiClient.getGoals({
        ...params,
        includeChildren: true,
      });

      // 批量创建客户端实体并同步到 store
      const goals = (goalsData.goals || []).map((goalData: any) => Goal.fromClientDTO(goalData));
      console.log("🔍 [API Response] Goals to be stored:", goals);
      this.goalStore.setGoals(goals);

      // 更新分页信息
      this.goalStore.setPagination({
        page: goalsData.page,
        limit: goalsData.pageSize,
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
   * ✅ 注意：始终使用 includeChildren=true 确保返回完整的 KeyResults
   * 这是必要的，因为 KeyResultDetailView 需要访问 keyResults 数组
   */
  async getGoalById(uuid: string): Promise<GoalContracts.GoalClientDTO | null> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      // ✅ 明确传递 includeChildren=true 以获取所有关键结果
      const data = await goalApiClient.getGoalById(uuid, true);

      // 🔍 诊断日志
      console.log('🔍 [API Response] Goal:', {
        uuid: data.uuid,
        title: data.title,
        hasKeyResults: !!data.keyResults,
        keyResultCount: data.keyResults?.length || 0,
        keyResults: data.keyResults,
      });

      // 创建客户端实体并同步到 store
      const goal = Goal.fromClientDTO(data);

      // 🔍 诊断日志
      console.log('🔍 [After Conversion] Goal entity:', {
        uuid: goal.uuid,
        title: goal.title,
        hasKeyResults: !!goal.keyResults,
        keyResultCount: goal.keyResults?.length || 0,
      });

      this.goalStore.addOrUpdateGoal(goal);

      // 🔍 诊断日志
      const storedGoal = this.goalStore.getGoalByUuid(uuid);
      console.log('🔍 [Pinia Store] After update:', {
        uuid: storedGoal?.uuid,
        title: storedGoal?.title,
        hasKeyResults: !!storedGoal?.keyResults,
        keyResultCount: storedGoal?.keyResults?.length || 0,
      });

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
      const goal = Goal.fromClientDTO(data);
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
      const goal = Goal.fromClientDTO(data);
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
      const goal = Goal.fromClientDTO(data);
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
      const goal = Goal.fromClientDTO(data);
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
      const goal = Goal.fromClientDTO(data);
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

      const response = await goalApiClient.searchGoals({
        query: params.keywords || '',
        status: params.status,
        dirUuid: params.dirUuid,
        page: params.page,
        limit: params.limit,
      });

      // 批量创建客户端实体并同步到 store
      const goals = (response.goals || []).map((goalData: any) => Goal.fromClientDTO(goalData));
      this.goalStore.setGoals(goals);

      // 更新分页信息
      this.goalStore.setPagination({
        page: response.page,
        limit: response.pageSize,
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

  /**
   * 获取Goal聚合根的完整视图
   */
  async getGoalAggregateView(goalUuid: string): Promise<GoalContracts.GoalAggregateViewResponse> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const data = await goalApiClient.getGoalAggregateView(goalUuid);

      // 将聚合根数据同步到store
      const goal = Goal.fromClientDTO(data.goal as GoalContracts.GoalClientDTO);
      this.goalStore.addOrUpdateGoal(goal);

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取目标聚合视图失败';
      this.goalStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 克隆Goal聚合根
   */
  async cloneGoal(
    goalUuid: string,
    request: {
      name?: string;
      description?: string;
      includeKeyResults?: boolean;
      includeRecords?: boolean;
    },
  ): Promise<GoalContracts.GoalClientDTO> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const data = await goalApiClient.cloneGoal(goalUuid, request);

      // 将克隆的目标添加到store
      const goal = Goal.fromClientDTO(data);
      this.goalStore.addOrUpdateGoal(goal);

      this.snackbar.showSuccess('目标克隆成功');
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '克隆目标失败';
      this.goalStore.setError(errorMessage);
      this.snackbar.showError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    try {
      // 先初始化 store（加载本地缓存）
      this.goalStore.initialize();
      console.log('✅ Goal Management Service 初始化完成');
    } catch (error) {
      console.error('❌ Goal 服务初始化失败:', error);
      throw error;
    }
  }
}

// 导出单例获取函数
export const goalManagementApplicationService = GoalManagementApplicationService.getInstance();
