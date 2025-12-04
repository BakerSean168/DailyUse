/**
 * Pause Schedule Task Service
 *
 * 暂停调度任务
 */

import type {
  IScheduleTaskRepository,
  IScheduleStatisticsRepository,
} from '@dailyuse/domain-server/schedule';
import { ScheduleDomainService } from '@dailyuse/domain-server/schedule';
import { ScheduleContainer } from '../ScheduleContainer';

/**
 * Service Input
 */
export interface PauseScheduleTaskInput {
  uuid: string;
}

/**
 * Service Output
 */
export interface PauseScheduleTaskOutput {
  success: boolean;
}

/**
 * Pause Schedule Task Service
 */
export class PauseScheduleTask {
  private static instance: PauseScheduleTask;
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
  ): PauseScheduleTask {
    const container = ScheduleContainer.getInstance();
    const taskRepo = taskRepository || container.getScheduleTaskRepository();
    const statsRepo = statisticsRepository || container.getStatisticsRepository();
    PauseScheduleTask.instance = new PauseScheduleTask(taskRepo, statsRepo);
    return PauseScheduleTask.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): PauseScheduleTask {
    if (!PauseScheduleTask.instance) {
      PauseScheduleTask.instance = PauseScheduleTask.createInstance();
    }
    return PauseScheduleTask.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    PauseScheduleTask.instance = undefined as unknown as PauseScheduleTask;
  }

  async execute(input: PauseScheduleTaskInput): Promise<PauseScheduleTaskOutput> {
    await this.domainService.pauseScheduleTask(input.uuid);

    return { success: true };
  }
}

/**
 * 便捷函数：暂停调度任务
 */
export const pauseScheduleTask = (input: PauseScheduleTaskInput): Promise<PauseScheduleTaskOutput> =>
  PauseScheduleTask.getInstance().execute(input);
