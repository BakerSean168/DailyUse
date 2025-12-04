/**
 * Get Schedule Task Service
 *
 * 获取调度任务详情
 */

import type { IScheduleTaskRepository } from '@dailyuse/domain-server/schedule';
import type { ScheduleTaskClientDTO } from '@dailyuse/contracts/schedule';
import { ScheduleContainer } from '../ScheduleContainer';

/**
 * Service Input
 */
export interface GetScheduleTaskInput {
  uuid: string;
}

/**
 * Service Output
 */
export interface GetScheduleTaskOutput {
  task: ScheduleTaskClientDTO | null;
}

/**
 * Get Schedule Task Service
 */
export class GetScheduleTask {
  private static instance: GetScheduleTask;

  private constructor(private readonly taskRepository: IScheduleTaskRepository) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(taskRepository?: IScheduleTaskRepository): GetScheduleTask {
    const container = ScheduleContainer.getInstance();
    const repo = taskRepository || container.getScheduleTaskRepository();
    GetScheduleTask.instance = new GetScheduleTask(repo);
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

  async execute(input: GetScheduleTaskInput): Promise<GetScheduleTaskOutput> {
    const task = await this.taskRepository.findByUuid(input.uuid);

    return {
      task: task ? task.toClientDTO() : null,
    };
  }
}

/**
 * 便捷函数：获取调度任务
 */
export const getScheduleTask = (input: GetScheduleTaskInput): Promise<GetScheduleTaskOutput> =>
  GetScheduleTask.getInstance().execute(input);
