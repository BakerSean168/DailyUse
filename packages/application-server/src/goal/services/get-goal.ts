/**
 * Get Goal Service
 *
 * 获取单个目标详情的应用服务
 */

import type { IGoalRepository } from '@dailyuse/domain-server/goal';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';
import { GoalContainer } from '@dailyuse/infrastructure-server';

/**
 * Get Goal Input
 */
export interface GetGoalInput {
  uuid: string;
  includeChildren?: boolean;
}

/**
 * Get Goal Output
 */
export interface GetGoalOutput {
  goal: GoalClientDTO | null;
}

/**
 * Get Goal Service
 */
export class GetGoal {
  private static instance: GetGoal;

  private constructor(private readonly goalRepository: IGoalRepository) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(goalRepository?: IGoalRepository): GetGoal {
    const container = GoalContainer.getInstance();
    const repo = goalRepository || container.getGoalRepository();
    GetGoal.instance = new GetGoal(repo);
    return GetGoal.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetGoal {
    if (!GetGoal.instance) {
      GetGoal.instance = GetGoal.createInstance();
    }
    return GetGoal.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetGoal.instance = undefined as unknown as GetGoal;
  }

  async execute(input: GetGoalInput): Promise<GetGoalOutput> {
    const goal = await this.goalRepository.findById(input.uuid, {
      includeChildren: input.includeChildren,
    });

    return {
      goal: goal ? goal.toClientDTO(true) : null,
    };
  }
}

/**
 * 便捷函数：获取目标
 */
export const getGoal = (input: GetGoalInput): Promise<GetGoalOutput> =>
  GetGoal.getInstance().execute(input);
