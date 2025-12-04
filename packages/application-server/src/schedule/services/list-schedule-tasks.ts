/**
 * List Schedule Tasks Service
 *
 * 获取调度任务列表
 */

import type { IScheduleTaskRepository } from '@dailyuse/domain-server/schedule';
import type { ScheduleTaskClientDTO, SourceModule } from '@dailyuse/contracts/schedule';
import { ScheduleContainer } from '../ScheduleContainer';

/**
 * Service Input
 */
export interface ListScheduleTasksInput {
  accountUuid?: string;
  sourceModule?: SourceModule;
  sourceEntityId?: string;
}

/**
 * Service Output
 */
export interface ListScheduleTasksOutput {
  tasks: ScheduleTaskClientDTO[];
  total: number;
}

/**
 * List Schedule Tasks Service
 */
export class ListScheduleTasks {
  private static instance: ListScheduleTasks;

  private constructor(private readonly taskRepository: IScheduleTaskRepository) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(taskRepository?: IScheduleTaskRepository): ListScheduleTasks {
    const container = ScheduleContainer.getInstance();
    const repo = taskRepository || container.getScheduleTaskRepository();
    ListScheduleTasks.instance = new ListScheduleTasks(repo);
    return ListScheduleTasks.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ListScheduleTasks {
    if (!ListScheduleTasks.instance) {
      ListScheduleTasks.instance = ListScheduleTasks.createInstance();
    }
    return ListScheduleTasks.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ListScheduleTasks.instance = undefined as unknown as ListScheduleTasks;
  }

  async execute(input: ListScheduleTasksInput): Promise<ListScheduleTasksOutput> {
    let tasks;

    if (input.sourceModule && input.sourceEntityId) {
      tasks = await this.taskRepository.findBySourceEntity(
        input.sourceModule,
        input.sourceEntityId,
      );
    } else if (input.accountUuid) {
      tasks = await this.taskRepository.findByAccountUuid(input.accountUuid);
    } else {
      throw new Error('Either accountUuid or sourceModule+sourceEntityId must be provided');
    }

    return {
      tasks: tasks.map((task) => task.toClientDTO()),
      total: tasks.length,
    };
  }
}

/**
 * 便捷函数：列出调度任务
 */
export const listScheduleTasks = (input: ListScheduleTasksInput): Promise<ListScheduleTasksOutput> =>
  ListScheduleTasks.getInstance().execute(input);
