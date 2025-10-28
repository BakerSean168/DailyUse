import type { GoalContracts } from '@dailyuse/contracts';
import { GoalDomain } from '@dailyuse/domain-client';
import { goalApiClient, goalFolderApiClient } from '../../infrastructure/api/goalApiClient';
import { getGoalStore } from '../../presentation/stores/goalStore';
import { useSnackbar } from '../../../../shared/composables/useSnackbar';

// 导入类实现（用于实例化）
const GoalClient = GoalDomain.GoalClient;
const GoalFolderClient = GoalDomain.GoalFolderClient;

/**
 * Goal Web 应用服务
 * 负责协调 Web 端的目标相关操作，整合 API 调用和本地状态管理
 * 集成全局 Snackbar 提示系统
 */
export class GoalWebApplicationService {
  /**
   * 延迟获取 Snackbar（避免在 Pinia 初始化前访问）
   */
  private get snackbar() {
    return useSnackbar();
  }

  /**
   * 懒加载获取 Goal Store
   * 避免在 Pinia 初始化之前调用
   */
  private get goalStore() {
    return getGoalStore();
  }

  // ===== Goal CRUD 操作 =====

  async createGoal(request: GoalContracts.CreateGoalRequest): Promise<GoalContracts.GoalClientDTO> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const goalData = await goalApiClient.createGoal(request);

      // 创建客户端实体并同步到 store
      const goal = GoalClient.fromClientDTO(goalData);
      this.goalStore.addOrUpdateGoal(goal);

      return goalData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建目标失败';
      this.goalStore.setError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

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
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

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
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

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

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新目标失败';
      this.goalStore.setError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  async deleteGoal(uuid: string): Promise<void> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      await goalApiClient.deleteGoal(uuid);

      // 从 store 中移除
      this.goalStore.removeGoal(uuid);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除目标失败';
      this.goalStore.setError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  // ===== Goal 状态管理 =====

  async activateGoal(uuid: string): Promise<GoalContracts.GoalClientDTO> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const data = await goalApiClient.activateGoal(uuid);

      // 更新客户端实体并同步到 store
      const goal = GoalClient.fromClientDTO(data);
      this.goalStore.addOrUpdateGoal(goal);

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '激活目标失败';
      this.goalStore.setError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  async pauseGoal(uuid: string): Promise<GoalContracts.GoalClientDTO> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const data = await goalApiClient.pauseGoal(uuid);

      // 更新客户端实体并同步到 store
      const goal = GoalClient.fromClientDTO(data);
      this.goalStore.addOrUpdateGoal(goal);

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '暂停目标失败';
      this.goalStore.setError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  async completeGoal(uuid: string): Promise<GoalContracts.GoalClientDTO> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const data = await goalApiClient.completeGoal(uuid);

      // 更新客户端实体并同步到 store
      const goal = GoalClient.fromClientDTO(data);
      this.goalStore.addOrUpdateGoal(goal);

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '完成目标失败';
      this.goalStore.setError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  async archiveGoal(uuid: string): Promise<GoalContracts.GoalClientDTO> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const data = await goalApiClient.archiveGoal(uuid);

      // 更新客户端实体并同步到 store
      const goal = GoalClient.fromClientDTO(data);
      this.goalStore.addOrUpdateGoal(goal);

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '归档目标失败';
      this.goalStore.setError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  // ===== GoalFolder 管理 =====

  async createGoalFolder(
    request: GoalContracts.CreateGoalFolderRequest,
  ): Promise<GoalContracts.GoalFolderClientDTO> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const data = await goalFolderApiClient.createGoalFolder(request);

      // 创建客户端实体并同步到 store
      const goalFolder = GoalFolderClient.fromClientDTO(data);
      this.goalStore.addOrUpdateGoalFolder(goalFolder);

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建目标目录失败';
      this.goalStore.setError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  async getGoalFolders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    parentUuid?: string;
  }): Promise<GoalContracts.GoalFolderListResponse> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const data = await goalFolderApiClient.getGoalFolders(params);

      // 批量创建客户端实体并同步到 store
      const goalFolders = (data?.folders || []).map((dirData: any) => GoalFolderClient.fromClientDTO(dirData));
      this.goalStore.setGoalFolders(goalFolders);

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取目标目录列表失败';
      this.goalStore.setError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  async updateGoalFolder(
    uuid: string,
    request: GoalContracts.UpdateGoalFolderRequest,
  ): Promise<GoalContracts.GoalFolderClientDTO> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const data = await goalFolderApiClient.updateGoalFolder(uuid, request);

      // 更新客户端实体并同步到 store
      const goalFolder = GoalFolderClient.fromClientDTO(data);
      this.goalStore.addOrUpdateGoalFolder(goalFolder);

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新目标目录失败';
      this.goalStore.setError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  async deleteGoalFolder(uuid: string): Promise<void> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      await goalFolderApiClient.deleteGoalFolder(uuid);

      // 从 store 中移除
      this.goalStore.removeGoalFolder(uuid);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除目标目录失败';
      this.goalStore.setError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  // ===== 搜索和查询 =====

  async searchGoals(params: {
    query: string;
    page?: number;
    limit?: number;
    status?: string;
    dirUuid?: string;
  }): Promise<GoalContracts.GoalsResponse> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const data = await goalApiClient.searchGoals(params);

      // 搜索结果不自动同步到 store，只返回结果
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '搜索目标失败';
      this.goalStore.setError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  // ===== 批量操作 =====

  async refreshGoals(): Promise<void> {
    await this.getGoals();
  }

  async refreshGoalFolders(): Promise<void> {
    await this.getGoalFolders();
  }

  async refreshAll(): Promise<void> {
    await Promise.all([this.refreshGoals(), this.refreshGoalFolders()]);
  }

  // ===== 数据同步方法 =====

  /**
   * 同步所有目标数据到 store
   * 用于应用初始化时加载所有数据
   */
  async syncAllGoals(): Promise<{
    goalsCount: number;
    goalFoldersCount: number;
  }> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      // 并行获取所有目标和目录数据
      console.log('📡 开始发起 API 请求...');
      const [goalsData, goalFoldersData] = await Promise.all([
        goalApiClient.getGoals({ limit: 1000 }), // 获取所有目标，设置较大的 limit
        goalFolderApiClient.getGoalFolders({ limit: 1000 }), // 获取所有目录
      ]);
      console.log('🔍 API 响应数据:', {
        goalsData,
        goalFoldersData,
        goalsType: typeof goalsData,
        goalFoldersType: typeof goalFoldersData,
        goalsDataStructure: goalsData ? Object.keys(goalsData) : 'null/undefined',
        goalFoldersDataStructure: goalFoldersData ? Object.keys(goalFoldersData) : 'null/undefined',
      });

      // 转换为客户端实体
      const goals = (goalsData?.data || []).map((goalData: any) => GoalClient.fromClientDTO(goalData));
      const goalFolders = (goalFoldersData?.data || []).map((dirData: any) => GoalFolderClient.fromClientDTO(dirData));

      // 批量同步到 store
      this.goalStore.setGoals(goals);
      this.goalStore.setGoalFolders(goalFolders);

      // 更新分页信息（如果有）
      if (goalsData?.page) {
        this.goalStore.setPagination({
          page: goalsData.page,
          limit: goalsData.limit,
          total: goalsData.total,
        });
      }

      console.log(`成功同步数据: ${goals.length} 个目标, ${goalFolders.length} 个目录`);

      return {
        goalsCount: goals.length,
        goalFoldersCount: goalFolders.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '同步所有目标数据失败';
      this.goalStore.setError(errorMessage);
      console.error('同步所有目标数据失败:', error);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  // ===== DDD聚合根控制：KeyResult管理 =====

  /**
   * 通过Goal聚合根创建关键结果
   * 体现DDD原则：只能通过Goal聚合根创建KeyResult
   */
  async createKeyResultForGoal(
    goalUuid: string,
    request: {
      name: string;
      description?: string;
      startValue: number;
      targetValue: number;
      currentValue?: number;
      unit: string;
      weight: number;
      calculationMethod?: 'sum' | 'average' | 'max' | 'min' | 'custom';
    },
  ): Promise<GoalContracts.KeyResultClientDTO> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const data = await goalApiClient.createKeyResultForGoal(goalUuid, request);

      // 更新关联的Goal实体（重新获取以包含新的KeyResult）
      await this.refreshGoalWithKeyResults(goalUuid);

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建关键结果失败';
      this.goalStore.setError(errorMessage);
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
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 通过Goal聚合根更新关键结果
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

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新关键结果失败';
      this.goalStore.setError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 通过Goal聚合根删除关键结果
   */
  async deleteKeyResultForGoal(goalUuid: string, keyResultUuid: string): Promise<void> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      await goalApiClient.deleteKeyResultForGoal(goalUuid, keyResultUuid);

      // 更新关联的Goal实体
      await this.refreshGoalWithKeyResults(goalUuid);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除关键结果失败';
      this.goalStore.setError(errorMessage);
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

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '批量更新关键结果权重失败';
      this.goalStore.setError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  // ===== DDD聚合根控制：GoalRecord管理 =====

  /**
   * 通过KeyResult创建目标记录
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
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  // ===== DDD聚合根控制：GoalReview管理 =====

  /**
   * 通过Goal聚合根创建目标复盘
   */
  async createGoalReview(
    goalUuid: string,
    request: GoalContracts.CreateGoalReviewRequest,
  ): Promise<GoalContracts.GoalReviewClientDTO> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const data = await goalApiClient.createGoalReview(goalUuid, request);

      // 更新关联的Goal实体
      await this.refreshGoalWithReviews(goalUuid);

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建目标复盘失败';
      this.goalStore.setError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 获取目标的所有复盘
   */
  async getGoalReviewsByGoal(goalUuid: string): Promise<GoalContracts.GoalReviewsResponse> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const data = await goalApiClient.getGoalReviewsByGoal(goalUuid);

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取目标复盘失败';
      this.goalStore.setError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 通过Goal聚合根更新目标复盘
   */
  async updateGoalReview(
    goalUuid: string,
    reviewUuid: string,
    request: Partial<GoalContracts.GoalReviewClientDTO>,
  ): Promise<GoalContracts.GoalReviewClientDTO> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const data = await goalApiClient.updateGoalReview(goalUuid, reviewUuid, request);

      // 更新关联的Goal实体
      await this.refreshGoalWithReviews(goalUuid);

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新目标复盘失败';
      this.goalStore.setError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 通过Goal聚合根删除目标复盘
   */
  async deleteGoalReview(goalUuid: string, reviewUuid: string): Promise<void> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      await goalApiClient.deleteGoalReview(goalUuid, reviewUuid);

      // 更新关联的Goal实体
      await this.refreshGoalWithReviews(goalUuid);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除目标复盘失败';
      this.goalStore.setError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  // ===== DDD聚合根完整视图 =====

  /**
   * 获取Goal聚合根的完整视图
   * 包含目标、关键结果、记录、复盘等所有子实体
   */
  async getGoalAggregateView(goalUuid: string): Promise<GoalContracts.GoalAggregateViewResponse> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const data = await goalApiClient.getGoalAggregateView(goalUuid);

      // 将聚合根数据同步到store
      const goal = GoalClient.fromClientDTO(data.goal as GoalContracts.GoalClientDTO);
      this.goalStore.addOrUpdateGoal(goal);

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取目标聚合视图失败';
      this.goalStore.setError(errorMessage);
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
      const goal = GoalClient.fromClientDTO(data);
      this.goalStore.addOrUpdateGoal(goal);

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '克隆目标失败';
      this.goalStore.setError(errorMessage);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  // ===== 辅助方法 =====

  /**
   * 刷新Goal及其KeyResults
   * 用于在KeyResult操作后更新Goal状态
   */
  private async refreshGoalWithKeyResults(goalUuid: string): Promise<void> {
    try {
      const goalResponse = await goalApiClient.getGoalById(goalUuid);
      const goal = GoalClient.fromClientDTO(goalResponse);
      this.goalStore.addOrUpdateGoal(goal);
    } catch (error) {
      console.warn('刷新Goal和KeyResults失败:', error);
    }
  }

  /**
   * 刷新Goal及其Reviews
   * 用于在GoalReview操作后更新Goal状态
   */
  private async refreshGoalWithReviews(goalUuid: string): Promise<void> {
    try {
      const goalResponse = await goalApiClient.getGoalById(goalUuid);
      const goal = GoalClient.fromClientDTO(goalResponse);
      this.goalStore.addOrUpdateGoal(goal);
    } catch (error) {
      console.warn('刷新Goal和Reviews失败:', error);
    }
  }

  /**
   * 增量同步数据
   * 只同步在指定时间之后更新的数据
   */
  async syncIncrementalData(lastSyncTime?: Date): Promise<{
    goalsCount: number;
    goalFoldersCount: number;
  }> {
    try {
      this.goalStore.setLoading(true);
      this.goalStore.setError(null);

      const params = lastSyncTime
        ? {
            limit: 1000,
            updatedAfter: lastSyncTime.toISOString(),
          }
        : { limit: 1000 };

      // 并行获取更新的数据
      const [goalsResponse, goalFoldersResponse] = await Promise.all([
        goalApiClient.getGoals(params),
        goalFolderApiClient.getGoalFolders(params),
      ]);

      // 转换为客户端实体
      const goals = (goalsResponse?.data || []).map((goalData: any) => GoalClient.fromClientDTO(goalData));
      const goalFolders = (goalFoldersResponse?.folders || []).map((dirData: any) =>
        GoalFolderClient.fromClientDTO(dirData),
      );

      // 逐个同步到 store（保持现有数据）
      goals.forEach((goal: any) => this.goalStore.addOrUpdateGoal(goal));
      goalFolders.forEach((goalFolder: any) => this.goalStore.addOrUpdateGoalFolder(goalFolder));

      console.log(`增量同步完成: ${goals.length} 个目标, ${goalFolders.length} 个目录`);

      return {
        goalsCount: goals.length,
        goalFoldersCount: goalFolders.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '增量同步数据失败';
      this.goalStore.setError(errorMessage);
      console.error('增量同步数据失败:', error);
      throw error;
    } finally {
      this.goalStore.setLoading(false);
    }
  }

  /**
   * 检查是否需要同步数据
   */
  shouldSyncData(): boolean {
    return (
      !this.goalStore.isInitialized ||
      this.goalStore.getAllGoals.length === 0 ||
      this.goalStore.shouldRefreshCache()
    );
  }

  // ===== 工具方法 =====

  /**
   * 获取 Goal Store 实例
   */
  getStore(): ReturnType<typeof getGoalStore> {
    return this.goalStore;
  }

  /**
   * 初始化服务
   * 会自动同步所有目标和目录数据到 store
   */
  async initialize(): Promise<void> {
    try {
      // 先初始化 store（加载本地缓存）
      this.goalStore.initialize();

      // 检查是否需要从服务器同步数据
      if (this.shouldSyncData()) {
        console.log('开始同步所有目标数据...');
        await this.syncAllGoals();
      } else {
        console.log('使用本地缓存数据，跳过服务器同步');
      }
    } catch (error) {
      console.error('Goal 服务初始化失败:', error);
      // 即使同步失败，也要完成 store 的初始化
      if (!this.goalStore.isInitialized) {
        this.goalStore.initialize();
      }
      throw error;
    }
  }

  /**
   * 仅初始化模块（不进行数据同步）
   * 用于应用启动时的基础模块初始化
   */
  async initializeModule(): Promise<void> {
    try {
      // 只初始化 store（加载本地缓存），不进行网络同步
      this.goalStore.initialize();
      console.log('Goal 模块基础初始化完成（仅本地缓存）');
    } catch (error) {
      console.error('Goal 模块初始化失败:', error);
      throw error;
    }
  }

  /**
   * 强制重新同步所有数据
   */
  async forceSync(): Promise<void> {
    console.log('强制重新同步所有数据...');
    await this.syncAllGoals();
  }
}

/**
 * Goal Web 应用服务单例
 */
export const goalWebApplicationService = new GoalWebApplicationService();
