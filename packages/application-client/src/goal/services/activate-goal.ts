/**
 * Activate Goal
 *
 * 激活目标用例
 */

import type { IGoalApiClient } from '@dailyuse/infrastructure-client';
import { Goal } from '@dailyuse/domain-client/goal';
import { GoalContainer } from '@dailyuse/infrastructure-client';

/**
 * Activate Goal
 */
export class ActivateGoal {
  private static instance: ActivateGoal;

  private constructor(private readonly apiClient: IGoalApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IGoalApiClient): ActivateGoal {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getGoalApiClient();
    ActivateGoal.instance = new ActivateGoal(client);
    return ActivateGoal.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ActivateGoal {
    if (!ActivateGoal.instance) {
      ActivateGoal.instance = ActivateGoal.createInstance();
    }
    return ActivateGoal.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ActivateGoal.instance = undefined as unknown as ActivateGoal;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string): Promise<Goal> {
    const data = await this.apiClient.activateGoal(uuid);
    return Goal.fromClientDTO(data);
  }
}

/**
 * 便捷函数
 */
export const activateGoal = (uuid: string): Promise<Goal> =>
  ActivateGoal.getInstance().execute(uuid);
