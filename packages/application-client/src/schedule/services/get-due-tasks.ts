/**
 * Get Due Tasks
 *
 * 获取到期任务用例
 */

import type { IScheduleTaskApiClient } from '@dailyuse/infrastructure-client';
import type { ScheduleTaskClientDTO } from '@dailyuse/contracts/schedule';
import { ScheduleContainer } from '../ScheduleContainer';

/**
 * Get Due Tasks Input
 */
export interface GetDueTasksInput {
  beforeTime?: string;
  limit?: number;
}

/**
 * Get Due Tasks
 */
export class GetDueTasks {
  private static instance: GetDueTasks;

  private constructor(private readonly apiClient: IScheduleTaskApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IScheduleTaskApiClient): GetDueTasks {
    const container = ScheduleContainer.getInstance();
    const client = apiClient || container.getScheduleTaskApiClient();
    GetDueTasks.instance = new GetDueTasks(client);
    return GetDueTasks.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetDueTasks {
    if (!GetDueTasks.instance) {
      GetDueTasks.instance = GetDueTasks.createInstance();
    }
    return GetDueTasks.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetDueTasks.instance = undefined as unknown as GetDueTasks;
  }

  /**
   * 执行用例
   */
  async execute(input?: GetDueTasksInput): Promise<ScheduleTaskClientDTO[]> {
    return this.apiClient.getDueTasks(input);
  }
}

/**
 * 便捷函数
 */
export const getDueTasks = (input?: GetDueTasksInput): Promise<ScheduleTaskClientDTO[]> =>
  GetDueTasks.getInstance().execute(input);
