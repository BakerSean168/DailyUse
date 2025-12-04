/**
 * Create Schedule Task Service
 *
 * 创建新的调度任务
 */

import type {
  IScheduleTaskRepository,
  IScheduleStatisticsRepository,
} from '@dailyuse/domain-server/schedule';
import { ScheduleDomainService } from '@dailyuse/domain-server/schedule';
import type {
  ScheduleTaskClientDTO,
  ScheduleConfigServerDTO,
  RetryPolicyServerDTO,
  SourceModule,
} from '@dailyuse/contracts/schedule';
import { ScheduleContainer } from '../ScheduleContainer';

/**
 * Service Input
 */
export interface CreateScheduleTaskInput {
  accountUuid: string;
  name: string;
  description?: string;
  sourceModule: SourceModule;
  sourceEntityId: string;
  schedule: ScheduleConfigServerDTO;
  retryConfig?: RetryPolicyServerDTO;
  payload?: Record<string, unknown>;
  tags?: string[];
}

/**
 * Service Output
 */
export interface CreateScheduleTaskOutput {
  task: ScheduleTaskClientDTO;
}

/**
 * Create Schedule Task Service
 */
export class CreateScheduleTask {
  private static instance: CreateScheduleTask;
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
  ): CreateScheduleTask {
    const container = ScheduleContainer.getInstance();
    const taskRepo = taskRepository || container.getScheduleTaskRepository();
    const statsRepo = statisticsRepository || container.getStatisticsRepository();
    CreateScheduleTask.instance = new CreateScheduleTask(taskRepo, statsRepo);
    return CreateScheduleTask.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CreateScheduleTask {
    if (!CreateScheduleTask.instance) {
      CreateScheduleTask.instance = CreateScheduleTask.createInstance();
    }
    return CreateScheduleTask.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CreateScheduleTask.instance = undefined as unknown as CreateScheduleTask;
  }

  async execute(input: CreateScheduleTaskInput): Promise<CreateScheduleTaskOutput> {
    const task = await this.domainService.createScheduleTask(input);

    return {
      task: task.toClientDTO(),
    };
  }
}

/**
 * 便捷函数：创建调度任务
 */
export const createScheduleTask = (input: CreateScheduleTaskInput): Promise<CreateScheduleTaskOutput> =>
  CreateScheduleTask.getInstance().execute(input);
