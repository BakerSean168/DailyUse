/**
 * Reminder Container
 *
 * Reminder 模块的依赖容器
 */

import type { IReminderApiClient } from '../../reminder';
import { DIContainer } from './DIContainer';
import { DependencyKeys } from './dependency-keys';

/**
 * Reminder 依赖容器
 */
export class ReminderContainer {
  private static instance: ReminderContainer;

  private constructor() {}

  /**
   * 获取容器单例
   */
  static getInstance(): ReminderContainer {
    if (!ReminderContainer.instance) {
      ReminderContainer.instance = new ReminderContainer();
    }
    return ReminderContainer.instance;
  }

  /**
   * 重置容器
   */
  static resetInstance(): void {
    ReminderContainer.instance = undefined as unknown as ReminderContainer;
  }

  /**
   * 注册 Reminder API Client
   */
  registerReminderApiClient(client: IReminderApiClient): void {
    DIContainer.getInstance().register(DependencyKeys.REMINDER_API_CLIENT, client);
  }

  /**
   * 获取 Reminder API Client
   */
  getReminderApiClient(): IReminderApiClient {
    return DIContainer.getInstance().resolve<IReminderApiClient>(DependencyKeys.REMINDER_API_CLIENT);
  }
}
