/**
 * Get Task Instances By Date Range Service
 *
 * 根据日期范围获取任务实例
 */

import type { ITaskInstanceRepository } from '@dailyuse/domain-server/task';
import type { TaskInstanceServerDTO } from '@dailyuse/contracts/task';
import { TaskContainer } from '@dailyuse/infrastructure-server';

/**
 * Service Input
 */
export interface GetTaskInstancesByDateRangeInput {
  accountUuid: string;
  startDate: number;
  endDate: number;
}

/**
 * Service Output
 */
export interface GetTaskInstancesByDateRangeOutput {
  instances: TaskInstanceServerDTO[];
  total: number;
}

/**
 * Get Task Instances By Date Range Service
 */
export class GetTaskInstancesByDateRange {
  private static instance: GetTaskInstancesByDateRange;

  private constructor(private readonly instanceRepository: ITaskInstanceRepository) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(instanceRepository?: ITaskInstanceRepository): GetTaskInstancesByDateRange {
    const container = TaskContainer.getInstance();
    const repo = instanceRepository || container.getInstanceRepository();
    GetTaskInstancesByDateRange.instance = new GetTaskInstancesByDateRange(repo);
    return GetTaskInstancesByDateRange.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetTaskInstancesByDateRange {
    if (!GetTaskInstancesByDateRange.instance) {
      GetTaskInstancesByDateRange.instance = GetTaskInstancesByDateRange.createInstance();
    }
    return GetTaskInstancesByDateRange.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetTaskInstancesByDateRange.instance = undefined as unknown as GetTaskInstancesByDateRange;
  }

  async execute(input: GetTaskInstancesByDateRangeInput): Promise<GetTaskInstancesByDateRangeOutput> {
    const instances = await this.instanceRepository.findByDateRange(
      input.accountUuid,
      input.startDate,
      input.endDate,
    );

    return {
      instances: instances.map((i) => i.toClientDTO()),
      total: instances.length,
    };
  }
}

/**
 * 便捷函数：按日期范围获取任务实例
 */
export const getTaskInstancesByDateRange = (input: GetTaskInstancesByDateRangeInput): Promise<GetTaskInstancesByDateRangeOutput> =>
  GetTaskInstancesByDateRange.getInstance().execute(input);
