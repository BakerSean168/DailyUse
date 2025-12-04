/**
 * List Goals
 *
 * 获取目标列表用例
 */

import type { IGoalApiClient } from '@dailyuse/infrastructure-client';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';
import { Goal } from '@dailyuse/domain-client/goal';
import { GoalContainer } from '../GoalContainer';

/**
 * List Goals Input
 */
export interface ListGoalsInput {
  page?: number;
  limit?: number;
  status?: string;
  dirUuid?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * List Goals Output
 */
export interface ListGoalsOutput {
  goals: Goal[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

/**
 * List Goals
 */
export class ListGoals {
  private static instance: ListGoals;

  private constructor(private readonly apiClient: IGoalApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IGoalApiClient): ListGoals {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getGoalApiClient();
    ListGoals.instance = new ListGoals(client);
    return ListGoals.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ListGoals {
    if (!ListGoals.instance) {
      ListGoals.instance = ListGoals.createInstance();
    }
    return ListGoals.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ListGoals.instance = undefined as unknown as ListGoals;
  }

  /**
   * 执行用例
   */
  async execute(input: ListGoalsInput = {}): Promise<ListGoalsOutput> {
    const goalsData = await this.apiClient.getGoals({
      ...input,
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
}

/**
 * 便捷函数
 */
export const listGoals = (input: ListGoalsInput = {}): Promise<ListGoalsOutput> =>
  ListGoals.getInstance().execute(input);
