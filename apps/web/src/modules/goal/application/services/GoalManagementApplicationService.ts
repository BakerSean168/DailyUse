/**
 * Goal Management Application Service
 * 目标管理应用服务 - 负责目标的 CRUD 和状态管理
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

import type {
  GoalClientDTO,
  CreateGoalRequest,
  UpdateGoalRequest,
  GoalAggregateViewResponse,
} from '@dailyuse/contracts/goal';
import { Goal } from '@dailyuse/domain-client/goal';
import { goalApiClient } from '../../infrastructure/api/goalApiClient';

export class GoalManagementApplicationService {
  private static instance: GoalManagementApplicationService;

  private constructor() {}

  /**
   * 获取服务单例
   */
  static getInstance(): GoalManagementApplicationService {
    if (!GoalManagementApplicationService.instance) {
      GoalManagementApplicationService.instance = new GoalManagementApplicationService();
    }
    return GoalManagementApplicationService.instance;
  }

  // ===== Goal CRUD 操作 =====

  /**
   * 创建目标
   * @returns 返回创建的实体对象，调用方负责存储
   */
  async createGoal(request: CreateGoalRequest): Promise<Goal> {
    const goalData = await goalApiClient.createGoal(request);
    return Goal.fromClientDTO(goalData);
  }

  /**
   * 获取目标列表
   * @returns 返回目标实体数组和分页信息
   */
  async getGoals(params?: {
    page?: number;
    limit?: number;
    status?: string;
    dirUuid?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ goals: Goal[]; pagination: { page: number; limit: number; total: number } }> {
    // ✅ 确保 includeChildren=true 以获取 KeyResults
    const goalsData = await goalApiClient.getGoals({
      ...params,
      includeChildren: true,
    });

    console.log('[GoalManagementApplicationService] ✅ API 响应:', {
      goalsCount: goalsData.goals?.length || 0,
    });

    // 批量创建客户端实体
    const goals = (goalsData.goals || []).map((goalData: GoalClientDTO) => {
      const goal = Goal.fromClientDTO(goalData);
      return goal;
    });

    return {
      goals,
      pagination: {
        page: goalsData.page,
        limit: goalsData.pageSize,
        total: goalsData.total,
      },
    };
  }

  /**
   * 根据 UUID 获取目标详情
   * @returns 返回目标实体
   */
  async getGoalById(uuid: string): Promise<Goal> {
    // ✅ 明确传递 includeChildren=true 以获取所有关键结果
    const data = await goalApiClient.getGoalById(uuid, true);

    console.log('🔍 [API Response] Goal:', {
      uuid: data.uuid,
      title: data.title,
      hasKeyResults: !!data.keyResults,
      keyResultCount: data.keyResults?.length || 0,
    });

    return Goal.fromClientDTO(data);
  }

  /**
   * 更新目标
   * @returns 返回更新后的目标实体
   */
  async updateGoal(uuid: string, request: UpdateGoalRequest): Promise<Goal> {
    const data = await goalApiClient.updateGoal(uuid, request);
    return Goal.fromClientDTO(data);
  }

  /**
   * 删除目标
   */
  async deleteGoal(uuid: string): Promise<void> {
    await goalApiClient.deleteGoal(uuid);
  }

  // ===== Goal 状态管理 =====

  /**
   * 激活目标
   * @returns 返回激活后的目标实体
   */
  async activateGoal(uuid: string): Promise<Goal> {
    const data = await goalApiClient.activateGoal(uuid);
    return Goal.fromClientDTO(data);
  }

  /**
   * 暂停目标
   * @returns 返回暂停后的目标实体
   */
  async pauseGoal(uuid: string): Promise<Goal> {
    const data = await goalApiClient.pauseGoal(uuid);
    return Goal.fromClientDTO(data);
  }

  /**
   * 完成目标
   * @returns 返回完成后的目标实体
   */
  async completeGoal(uuid: string): Promise<Goal> {
    const data = await goalApiClient.completeGoal(uuid);
    return Goal.fromClientDTO(data);
  }

  /**
   * 归档目标
   * @returns 返回归档后的目标实体
   */
  async archiveGoal(uuid: string): Promise<Goal> {
    const data = await goalApiClient.archiveGoal(uuid);
    return Goal.fromClientDTO(data);
  }

  /**
   * 搜索目标
   * @returns 返回搜索结果
   */
  async searchGoals(params: {
    keywords?: string;
    status?: string;
    dirUuid?: string;
    page?: number;
    limit?: number;
  }): Promise<{ goals: Goal[]; pagination: { page: number; limit: number; total: number } }> {
    const response = await goalApiClient.searchGoals({
      query: params.keywords || '',
      status: params.status,
      dirUuid: params.dirUuid,
      page: params.page,
      limit: params.limit,
    });

    const goals = (response.goals || []).map((goalData: GoalClientDTO) =>
      Goal.fromClientDTO(goalData),
    );

    return {
      goals,
      pagination: {
        page: response.page,
        limit: response.pageSize,
        total: response.total,
      },
    };
  }

  /**
   * 获取Goal聚合根的完整视图
   * @returns 返回聚合视图和目标实体
   */
  async getGoalAggregateView(
    goalUuid: string,
  ): Promise<{ goal: Goal; rawResponse: GoalAggregateViewResponse }> {
    const data = await goalApiClient.getGoalAggregateView(goalUuid);
    const goal = Goal.fromClientDTO(data.goal as GoalClientDTO);

    return {
      goal,
      rawResponse: data,
    };
  }

  /**
   * 克隆Goal聚合根
   * @returns 返回克隆的目标实体
   */
  async cloneGoal(
    goalUuid: string,
    request: {
      name?: string;
      description?: string;
      includeKeyResults?: boolean;
      includeRecords?: boolean;
    },
  ): Promise<Goal> {
    const data = await goalApiClient.cloneGoal(goalUuid, request);
    return Goal.fromClientDTO(data);
  }
}

// 导出单例获取函数
export const goalManagementApplicationService = GoalManagementApplicationService.getInstance();

