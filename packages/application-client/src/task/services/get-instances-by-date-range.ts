/**
 * Get Task Instances By Date Range
 *
 * 按日期范围获取任务实例用例
 */

import type { ITaskTemplateApiClient } from '@dailyuse/infrastructure-client';
import { TaskInstance } from '@dailyuse/domain-client/task';
import { TaskContainer } from '@dailyuse/infrastructure-client';

export interface GetInstancesByDateRangeInput {
  templateUuid: string;
  from: number;
  to: number;
}

/**
 * Get Task Instances By Date Range
 */
export class GetInstancesByDateRange {
  private static instance: GetInstancesByDateRange;

  private constructor(private readonly apiClient: ITaskTemplateApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ITaskTemplateApiClient): GetInstancesByDateRange {
    const container = TaskContainer.getInstance();
    const client = apiClient || container.getTemplateApiClient();
    GetInstancesByDateRange.instance = new GetInstancesByDateRange(client);
    return GetInstancesByDateRange.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetInstancesByDateRange {
    if (!GetInstancesByDateRange.instance) {
      GetInstancesByDateRange.instance = GetInstancesByDateRange.createInstance();
    }
    return GetInstancesByDateRange.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetInstancesByDateRange.instance = undefined as unknown as GetInstancesByDateRange;
  }

  /**
   * 执行用例
   */
  async execute(input: GetInstancesByDateRangeInput): Promise<TaskInstance[]> {
    const instanceDTOs = await this.apiClient.getInstancesByDateRange(
      input.templateUuid,
      input.from,
      input.to
    );
    return instanceDTOs.map(dto => TaskInstance.fromClientDTO(dto));
  }
}

/**
 * 便捷函数
 */
export const getInstancesByDateRange = (input: GetInstancesByDateRangeInput): Promise<TaskInstance[]> =>
  GetInstancesByDateRange.getInstance().execute(input);
