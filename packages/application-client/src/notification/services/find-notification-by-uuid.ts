/**
 * Find Notification By Uuid
 *
 * 根据 UUID 获取通知详情用例
 */

import type { NotificationClientDTO } from '@dailyuse/contracts/notification';
import type { INotificationApiClient } from '@dailyuse/infrastructure-client';
import { NotificationContainer } from '@dailyuse/infrastructure-client';

/**
 * Find Notification By Uuid
 */
export class FindNotificationByUuid {
  private static instance: FindNotificationByUuid;

  private constructor(private readonly apiClient: INotificationApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: INotificationApiClient): FindNotificationByUuid {
    const container = NotificationContainer.getInstance();
    const client = apiClient || container.getApiClient();
    FindNotificationByUuid.instance = new FindNotificationByUuid(client);
    return FindNotificationByUuid.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): FindNotificationByUuid {
    if (!FindNotificationByUuid.instance) {
      FindNotificationByUuid.instance = FindNotificationByUuid.createInstance();
    }
    return FindNotificationByUuid.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    FindNotificationByUuid.instance = undefined as unknown as FindNotificationByUuid;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string): Promise<NotificationClientDTO> {
    return this.apiClient.findNotificationByUuid(uuid);
  }
}

/**
 * 便捷函数
 */
export const findNotificationByUuid = (uuid: string): Promise<NotificationClientDTO> =>
  FindNotificationByUuid.getInstance().execute(uuid);
