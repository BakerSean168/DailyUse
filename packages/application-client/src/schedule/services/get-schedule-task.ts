/**
 * Get Schedule Task
 *
 * 获取调度任务详情用例
 */

import type { IScheduleTaskApiClient } from '@dailyuse/infrastructure-client';
import type { ScheduleTaskClientDTO } from '@dailyuse/contracts/schedule';
import { ScheduleContainer } from '@dailyuse/infrastructure-client';

/**
 * Get Schedule Task
 */
export class GetScheduleTask {
  private static instance: GetScheduleTask;

  private constructor(private readonly apiClient: IScheduleTaskApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IScheduleTaskApiClient): GetScheduleTask {
    const container = ScheduleContainer.getInstance();
    const client = apiClient || container.getScheduleTaskApiClient();
    GetScheduleTask.instance = new GetScheduleTask(client);
    return GetScheduleTask.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetScheduleTask {
    if (!GetScheduleTask.instance) {
      GetScheduleTask.instance = GetScheduleTask.createInstance();
    }
    return GetScheduleTask.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetScheduleTask.instance = undefined as unknown as GetScheduleTask;
  }

  /**
   * 执行用例
   */
  async execute(taskUuid: string): Promise<ScheduleTaskClientDTO> {
    return this.apiClient.getTaskById(taskUuid);
  }
}

/**
 * 便捷函数
 */
export const getScheduleTask = (taskUuid: string): Promise<ScheduleTaskClientDTO> =>
  GetScheduleTask.getInstance().execute(taskUuid);
