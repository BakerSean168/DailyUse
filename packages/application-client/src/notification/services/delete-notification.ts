/**
 * Delete Notification
 *
 * 删除通知用例
 */

import type { INotificationApiClient } from '@dailyuse/infrastructure-client';
import { NotificationContainer } from '../NotificationContainer';

/**
 * Delete Notification Output
 */
export interface DeleteNotificationOutput {
  success: boolean;
}

/**
 * Delete Notification
 */
export class DeleteNotification {
  private static instance: DeleteNotification;

  private constructor(private readonly apiClient: INotificationApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: INotificationApiClient): DeleteNotification {
    const container = NotificationContainer.getInstance();
    const client = apiClient || container.getNotificationApiClient();
    DeleteNotification.instance = new DeleteNotification(client);
    return DeleteNotification.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): DeleteNotification {
    if (!DeleteNotification.instance) {
      DeleteNotification.instance = DeleteNotification.createInstance();
    }
    return DeleteNotification.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    DeleteNotification.instance = undefined as unknown as DeleteNotification;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string): Promise<DeleteNotificationOutput> {
    return this.apiClient.deleteNotification(uuid);
  }
}

/**
 * 便捷函数
 */
export const deleteNotification = (uuid: string): Promise<DeleteNotificationOutput> =>
  DeleteNotification.getInstance().execute(uuid);
