/**
 * Update Goal
 *
 * 更新目标用例
 */

import type { IGoalApiClient } from '@dailyuse/infrastructure-client';
import type { UpdateGoalRequest } from '@dailyuse/contracts/goal';
import { Goal } from '@dailyuse/domain-client/goal';
import { GoalContainer } from '@dailyuse/infrastructure-client';

/**
 * Update Goal Input
 */
export interface UpdateGoalInput {
  uuid: string;
  request: UpdateGoalRequest;
}

/**
 * Update Goal
 */
export class UpdateGoal {
  private static instance: UpdateGoal;

  private constructor(private readonly apiClient: IGoalApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IGoalApiClient): UpdateGoal {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getApiClient();
    UpdateGoal.instance = new UpdateGoal(client);
    return UpdateGoal.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): UpdateGoal {
    if (!UpdateGoal.instance) {
      UpdateGoal.instance = UpdateGoal.createInstance();
    }
    return UpdateGoal.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    UpdateGoal.instance = undefined as unknown as UpdateGoal;
  }

  /**
   * 执行用例
   */
  async execute(input: UpdateGoalInput): Promise<Goal> {
    const { uuid, request } = input;
    const data = await this.apiClient.updateGoal(uuid, request);
    return Goal.fromClientDTO(data);
  }
}

/**
 * 便捷函数
 */
export const updateGoal = (uuid: string, request: UpdateGoalRequest): Promise<Goal> =>
  UpdateGoal.getInstance().execute({ uuid, request });
