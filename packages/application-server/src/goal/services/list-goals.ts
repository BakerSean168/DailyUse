/**
 * List Goals Service
 *
 * 获取用户目标列表的应用服务
 */

import type { IGoalRepository } from '@dailyuse/domain-server/goal';
import { Goal } from '@dailyuse/domain-server/goal';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';
import { GoalContainer } from '../GoalContainer';

/**
 * List Goals Input
 */
export interface ListGoalsInput {
  accountUuid: string;
  includeChildren?: boolean;
  status?: string;
  folderUuid?: string;
}

/**
 * List Goals Output
 */
export interface ListGoalsOutput {
  goals: GoalClientDTO[];
  total: number;
}

/**
 * List Goals Service
 */
export class ListGoals {
  private static instance: ListGoals;

  private constructor(private readonly goalRepository: IGoalRepository) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(goalRepository?: IGoalRepository): ListGoals {
    const container = GoalContainer.getInstance();
    const repo = goalRepository || container.getGoalRepository();
    ListGoals.instance = new ListGoals(repo);
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

  async execute(input: ListGoalsInput): Promise<ListGoalsOutput> {
    const goals = await this.goalRepository.findByAccountUuid(input.accountUuid, {
      includeChildren: input.includeChildren,
      status: input.status,
      folderUuid: input.folderUuid,
    });

    return {
      goals: goals.map((g: Goal) => g.toClientDTO(true)),
      total: goals.length,
    };
  }
}

/**
 * 便捷函数：列出目标
 */
export const listGoals = (input: ListGoalsInput): Promise<ListGoalsOutput> =>
  ListGoals.getInstance().execute(input);
