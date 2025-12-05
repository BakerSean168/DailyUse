/**
 * Notification Container
 *
 * Notification 模块的依赖容器
 */

import type { INotificationApiClient } from '../../notification';
import { DIContainer } from './DIContainer';
import { DependencyKeys } from './dependency-keys';

/**
 * Notification 依赖容器
 */
export class NotificationContainer {
  private static instance: NotificationContainer;

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
   * 重置容器
   */
  static resetInstance(): void {
    NotificationContainer.instance = undefined as unknown as NotificationContainer;
  }

  /**
   * 注册 Notification API Client
   */
  registerNotificationApiClient(client: INotificationApiClient): void {
    DIContainer.getInstance().register(DependencyKeys.NOTIFICATION_API_CLIENT, client);
  }

  /**
   * 获取 Notification API Client
   */
  getNotificationApiClient(): INotificationApiClient {
    return DIContainer.getInstance().resolve<INotificationApiClient>(DependencyKeys.NOTIFICATION_API_CLIENT);
  }
}
