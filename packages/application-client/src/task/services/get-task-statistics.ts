/**
 * Get Task Statistics
 *
 * 获取任务统计数据用例
 */

import type { ITaskStatisticsApiClient } from '@dailyuse/infrastructure-client';
import type { TaskStatisticsServerDTO } from '@dailyuse/contracts/task';
import { TaskContainer } from '@dailyuse/infrastructure-client';

export interface GetTaskStatisticsInput {
  accountUuid: string;
  forceRecalculate?: boolean;
}

/**
 * Get Task Statistics
 */
export class GetTaskStatistics {
  private static instance: GetTaskStatistics;

  private constructor(private readonly apiClient: ITaskStatisticsApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ITaskStatisticsApiClient): GetTaskStatistics {
    const container = TaskContainer.getInstance();
    const client = apiClient || container.getStatisticsApiClient();
    GetTaskStatistics.instance = new GetTaskStatistics(client);
    return GetTaskStatistics.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetTaskStatistics {
    if (!GetTaskStatistics.instance) {
      GetTaskStatistics.instance = GetTaskStatistics.createInstance();
    }
    return GetTaskStatistics.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetTaskStatistics.instance = undefined as unknown as GetTaskStatistics;
  }

  /**
   * 执行用例
   */
  async execute(input: GetTaskStatisticsInput): Promise<TaskStatisticsServerDTO> {
    return this.apiClient.getTaskStatistics(input.accountUuid, input.forceRecalculate ?? false);
  }
}

/**
 * 便捷函数
 */
export const getTaskStatistics = (input: GetTaskStatisticsInput): Promise<TaskStatisticsServerDTO> =>
  GetTaskStatistics.getInstance().execute(input);
