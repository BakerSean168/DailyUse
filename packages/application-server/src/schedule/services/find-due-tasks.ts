/**
 * Find Due Tasks Service
 *
 * 查找需要执行的任务
 */

import type {
  IScheduleTaskRepository,
  IScheduleStatisticsRepository,
} from '@dailyuse/domain-server/schedule';
import { ScheduleDomainService } from '@dailyuse/domain-server/schedule';
import type { ScheduleTaskClientDTO } from '@dailyuse/contracts/schedule';
import { ScheduleContainer } from '../ScheduleContainer';

/**
 * Service Input
 */
export interface FindDueTasksInput {
  beforeTime: Date;
  limit?: number;
}

/**
 * Service Output
 */
export interface FindDueTasksOutput {
  tasks: ScheduleTaskClientDTO[];
  total: number;
}

/**
 * Find Due Tasks Service
 */
export class FindDueTasks {
  private static instance: FindDueTasks;
  private readonly domainService: ScheduleDomainService;

  private constructor(
    private readonly taskRepository: IScheduleTaskRepository,
    private readonly statisticsRepository: IScheduleStatisticsRepository,
  ) {
    this.domainService = new ScheduleDomainService(taskRepository, statisticsRepository);
  }

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(
    taskRepository?: IScheduleTaskRepository,
    statisticsRepository?: IScheduleStatisticsRepository,
  ): FindDueTasks {
    const container = ScheduleContainer.getInstance();
    const taskRepo = taskRepository || container.getScheduleTaskRepository();
    const statsRepo = statisticsRepository || container.getStatisticsRepository();
    FindDueTasks.instance = new FindDueTasks(taskRepo, statsRepo);
    return FindDueTasks.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): FindDueTasks {
    if (!FindDueTasks.instance) {
      FindDueTasks.instance = FindDueTasks.createInstance();
    }
    return FindDueTasks.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    FindDueTasks.instance = undefined as unknown as FindDueTasks;
  }

  async execute(input: FindDueTasksInput): Promise<FindDueTasksOutput> {
    const tasks = await this.domainService.findDueTasksForExecution(
      input.beforeTime,
      input.limit,
    );

    return {
      tasks: tasks.map((task) => task.toClientDTO()),
      total: tasks.length,
    };
  }
}

/**
 * 便捷函数：查找到期任务
 */
export const findDueTasks = (input: FindDueTasksInput): Promise<FindDueTasksOutput> =>
  FindDueTasks.getInstance().execute(input);
