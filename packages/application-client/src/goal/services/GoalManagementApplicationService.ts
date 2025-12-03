/**
 * Goal Management Application Service
 *
 * Handles Goal CRUD operations and status management.
 * Framework-agnostic - can be used in Web or Desktop.
 *
 * 职责：
 * - Goal CRUD 操作
 * - Goal 状态管理（激活、暂停、完成、归档）
 * - Goal 搜索
 *
 * 不负责：
 * - KeyResult 管理 → KeyResultApplicationService
 * - GoalRecord 管理 → GoalRecordApplicationService
 * - GoalReview 管理 → GoalReviewApplicationService
 * - GoalFolder 管理 → GoalFolderApplicationService
 */

import type { IGoalApiClient } from '@dailyuse/infrastructure-client';
import type {
  GoalClientDTO,
  CreateGoalRequest,
  UpdateGoalRequest,
  GoalAggregateViewResponse,
} from '@dailyuse/contracts/goal';
import { Goal } from '@dailyuse/domain-client/goal';

/**
 * Goal Management Application Service
 */
export class GoalManagementApplicationService {
  constructor(private readonly goalApiClient: IGoalApiClient) {}

  // ===== Goal CRUD 操作 =====

  /**
   * 创建目标
   * @returns 返回创建的实体对象
   */
  async createGoal(request: CreateGoalRequest): Promise<Goal> {
    const goalData = await this.goalApiClient.createGoal(request);
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
    const goalsData = await this.goalApiClient.getGoals({
      ...params,
      includeChildren: true,
    });

    const goals = (goalsData.goals || []).map((goalData: GoalClientDTO) =>
      Goal.fromClientDTO(goalData),
    );

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
    const data = await this.goalApiClient.getGoalById(uuid, true);
    return Goal.fromClientDTO(data);
  }

  /**
   * 更新目标
   * @returns 返回更新后的目标实体
   */
  async updateGoal(uuid: string, request: UpdateGoalRequest): Promise<Goal> {
    const data = await this.goalApiClient.updateGoal(uuid, request);
    return Goal.fromClientDTO(data);
  }

  /**
   * 删除目标
   */
  async deleteGoal(uuid: string): Promise<void> {
    await this.goalApiClient.deleteGoal(uuid);
  }

  // ===== Goal 状态管理 =====

  /**
   * 激活目标
   * @returns 返回激活后的目标实体
   */
  async activateGoal(uuid: string): Promise<Goal> {
    const data = await this.goalApiClient.activateGoal(uuid);
    return Goal.fromClientDTO(data);
  }

  /**
   * 暂停目标
   * @returns 返回暂停后的目标实体
   */
  async pauseGoal(uuid: string): Promise<Goal> {
    const data = await this.goalApiClient.pauseGoal(uuid);
    return Goal.fromClientDTO(data);
  }

  /**
   * 完成目标
   * @returns 返回完成后的目标实体
   */
  async completeGoal(uuid: string): Promise<Goal> {
    const data = await this.goalApiClient.completeGoal(uuid);
    return Goal.fromClientDTO(data);
  }

  /**
   * 归档目标
   * @returns 返回归档后的目标实体
   */
  async archiveGoal(uuid: string): Promise<Goal> {
    const data = await this.goalApiClient.archiveGoal(uuid);
    return Goal.fromClientDTO(data);
  }

  // ===== 搜索 =====

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
    const response = await this.goalApiClient.searchGoals({
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

  // ===== 聚合视图 =====

  /**
   * 获取Goal聚合根的完整视图
   * @returns 返回聚合视图和目标实体
   */
  async getGoalAggregateView(
    goalUuid: string,
  ): Promise<{ goal: Goal; rawResponse: GoalAggregateViewResponse }> {
    const data = await this.goalApiClient.getGoalAggregateView(goalUuid);
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
    const data = await this.goalApiClient.cloneGoal(goalUuid, request);
    return Goal.fromClientDTO(data);
  }
}

/**
 * Factory function to create GoalManagementApplicationService
 */
export function createGoalManagementService(
  goalApiClient: IGoalApiClient,
): GoalManagementApplicationService {
  return new GoalManagementApplicationService(goalApiClient);
}
