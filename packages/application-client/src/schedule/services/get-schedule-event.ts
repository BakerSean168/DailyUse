/**
 * Get Schedule Event
 *
 * 获取日程事件详情用例
 */

import type { IScheduleEventApiClient } from '@dailyuse/infrastructure-client';
import type { ScheduleClientDTO } from '@dailyuse/contracts/schedule';
import { ScheduleContainer } from '../ScheduleContainer';

/**
 * Get Schedule Event
 */
export class GetScheduleEvent {
  private static instance: GetScheduleEvent;

  private constructor(private readonly apiClient: IScheduleEventApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IScheduleEventApiClient): GetScheduleEvent {
    const container = ScheduleContainer.getInstance();
    const client = apiClient || container.getScheduleEventApiClient();
    GetScheduleEvent.instance = new GetScheduleEvent(client);
    return GetScheduleEvent.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetScheduleEvent {
    if (!GetScheduleEvent.instance) {
      GetScheduleEvent.instance = GetScheduleEvent.createInstance();
    }
    return GetScheduleEvent.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetScheduleEvent.instance = undefined as unknown as GetScheduleEvent;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string): Promise<ScheduleClientDTO> {
    return this.apiClient.getSchedule(uuid);
  }
}

/**
 * 便捷函数
 */
export const getScheduleEvent = (uuid: string): Promise<ScheduleClientDTO> =>
  GetScheduleEvent.getInstance().execute(uuid);
