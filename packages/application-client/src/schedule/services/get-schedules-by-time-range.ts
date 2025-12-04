/**
 * Get Schedules By Time Range
 *
 * 获取指定时间范围内的日程事件用例
 */

import type { IScheduleEventApiClient } from '@dailyuse/infrastructure-client';
import type { ScheduleClientDTO, GetSchedulesByTimeRangeRequest } from '@dailyuse/contracts/schedule';
import { ScheduleContainer } from '../ScheduleContainer';

/**
 * Get Schedules By Time Range Input
 */
export type GetSchedulesByTimeRangeInput = GetSchedulesByTimeRangeRequest;

/**
 * Get Schedules By Time Range
 */
export class GetSchedulesByTimeRange {
  private static instance: GetSchedulesByTimeRange;

  private constructor(private readonly apiClient: IScheduleEventApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IScheduleEventApiClient): GetSchedulesByTimeRange {
    const container = ScheduleContainer.getInstance();
    const client = apiClient || container.getScheduleEventApiClient();
    GetSchedulesByTimeRange.instance = new GetSchedulesByTimeRange(client);
    return GetSchedulesByTimeRange.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetSchedulesByTimeRange {
    if (!GetSchedulesByTimeRange.instance) {
      GetSchedulesByTimeRange.instance = GetSchedulesByTimeRange.createInstance();
    }
    return GetSchedulesByTimeRange.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetSchedulesByTimeRange.instance = undefined as unknown as GetSchedulesByTimeRange;
  }

  /**
   * 执行用例
   */
  async execute(input: GetSchedulesByTimeRangeInput): Promise<ScheduleClientDTO[]> {
    return this.apiClient.getSchedulesByTimeRange(input);
  }
}

/**
 * 便捷函数
 */
export const getSchedulesByTimeRange = (input: GetSchedulesByTimeRangeInput): Promise<ScheduleClientDTO[]> =>
  GetSchedulesByTimeRange.getInstance().execute(input);
