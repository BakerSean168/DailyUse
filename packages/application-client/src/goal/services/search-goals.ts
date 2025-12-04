/**
 * Search Goals
 *
 * 搜索目标用例
 */

import type { IGoalApiClient } from '@dailyuse/infrastructure-client';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';
import { Goal } from '@dailyuse/domain-client/goal';
import { GoalContainer } from '../GoalContainer';

/**
 * Search Goals Input
 */
export interface SearchGoalsInput {
  keywords?: string;
  status?: string;
  dirUuid?: string;
  page?: number;
  limit?: number;
}

/**
 * Search Goals Output
 */
export interface SearchGoalsOutput {
  goals: Goal[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

/**
 * Search Goals
 */
export class SearchGoals {
  private static instance: SearchGoals;

  private constructor(private readonly apiClient: IGoalApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IGoalApiClient): SearchGoals {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getGoalApiClient();
    SearchGoals.instance = new SearchGoals(client);
    return SearchGoals.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): SearchGoals {
    if (!SearchGoals.instance) {
      SearchGoals.instance = SearchGoals.createInstance();
    }
    return SearchGoals.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    SearchGoals.instance = undefined as unknown as SearchGoals;
  }

  /**
   * 执行用例
   */
  async execute(input: SearchGoalsInput = {}): Promise<SearchGoalsOutput> {
    const response = await this.apiClient.searchGoals({
      query: input.keywords || '',
      status: input.status,
      dirUuid: input.dirUuid,
      page: input.page,
      limit: input.limit,
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
}

/**
 * 便捷函数
 */
export const searchGoals = (input: SearchGoalsInput = {}): Promise<SearchGoalsOutput> =>
  SearchGoals.getInstance().execute(input);
