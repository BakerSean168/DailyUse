/**
 * List Schedules By Account
 *
 * 获取账户的所有日程事件用例
 */

import type { IScheduleEventApiClient } from '@dailyuse/infrastructure-client';
import type { ScheduleClientDTO } from '@dailyuse/contracts/schedule';
import { ScheduleContainer } from '../ScheduleContainer';

/**
 * List Schedules By Account
 */
export class ListSchedulesByAccount {
  private static instance: ListSchedulesByAccount;

  private constructor(private readonly apiClient: IScheduleEventApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IScheduleEventApiClient): ListSchedulesByAccount {
    const container = ScheduleContainer.getInstance();
    const client = apiClient || container.getScheduleEventApiClient();
    ListSchedulesByAccount.instance = new ListSchedulesByAccount(client);
    return ListSchedulesByAccount.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ListSchedulesByAccount {
    if (!ListSchedulesByAccount.instance) {
      ListSchedulesByAccount.instance = ListSchedulesByAccount.createInstance();
    }
    return ListSchedulesByAccount.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ListSchedulesByAccount.instance = undefined as unknown as ListSchedulesByAccount;
  }

  /**
   * 执行用例
   */
  async execute(): Promise<ScheduleClientDTO[]> {
    return this.apiClient.getSchedulesByAccount();
  }
}

/**
 * 便捷函数
 */
export const listSchedulesByAccount = (): Promise<ScheduleClientDTO[]> =>
  ListSchedulesByAccount.getInstance().execute();
