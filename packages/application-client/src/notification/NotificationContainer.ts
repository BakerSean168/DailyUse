/**
 * Notification Container
 *
 * 通知模块的依赖注入容器
 */

import type { INotificationApiClient } from '@dailyuse/infrastructure-client';

/**
 * Notification Container
 * 管理通知模块的依赖注入
 */
export class NotificationContainer {
  private static instance: NotificationContainer;
  private notificationApiClient: INotificationApiClient | null = null;

  private constructor() {}

  /**
   * 获取容器单例
   */
  static getInstance(): NotificationContainer {
    if (!NotificationContainer.instance) {
      NotificationContainer.instance = new NotificationContainer();
    }
    return NotificationContainer.instance;
  }

  /**
   * 重置容器（用于测试）
   */
  static resetInstance(): void {
    NotificationContainer.instance = undefined as unknown as NotificationContainer;
  }

  /**
   * 注册 Notification API Client
   */
  registerNotificationApiClient(client: INotificationApiClient): void {
    this.notificationApiClient = client;
  }

  /**
   * 获取 Notification API Client
   */
  getNotificationApiClient(): INotificationApiClient {
    if (!this.notificationApiClient) {
      throw new Error(
        'NotificationApiClient not registered. Call registerNotificationApiClient() first.',
      );
    }
    return this.notificationApiClient;
  }
}
