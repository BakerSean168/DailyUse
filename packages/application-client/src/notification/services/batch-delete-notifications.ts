/**
 * Batch Delete Notifications
 *
 * 批量删除通知用例
 */

import type { INotificationApiClient } from '@dailyuse/infrastructure-client';
import { NotificationContainer } from '../NotificationContainer';

/**
 * Batch Delete Notifications Output
 */
export interface BatchDeleteNotificationsOutput {
  success: boolean;
  count: number;
}

/**
 * Batch Delete Notifications
 */
export class BatchDeleteNotifications {
  private static instance: BatchDeleteNotifications;

  private constructor(private readonly apiClient: INotificationApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: INotificationApiClient): BatchDeleteNotifications {
    const container = NotificationContainer.getInstance();
    const client = apiClient || container.getNotificationApiClient();
    BatchDeleteNotifications.instance = new BatchDeleteNotifications(client);
    return BatchDeleteNotifications.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): BatchDeleteNotifications {
    if (!BatchDeleteNotifications.instance) {
      BatchDeleteNotifications.instance = BatchDeleteNotifications.createInstance();
    }
    return BatchDeleteNotifications.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    BatchDeleteNotifications.instance = undefined as unknown as BatchDeleteNotifications;
  }

  /**
   * 执行用例
   */
  async execute(uuids: string[]): Promise<BatchDeleteNotificationsOutput> {
    return this.apiClient.batchDeleteNotifications(uuids);
  }
}

/**
 * 便捷函数
 */
export const batchDeleteNotifications = (uuids: string[]): Promise<BatchDeleteNotificationsOutput> =>
  BatchDeleteNotifications.getInstance().execute(uuids);
