/**
 * Reminder Container
 *
 * Reminder 模块的依赖注入容器
 */

import type { IReminderApiClient } from '@dailyuse/infrastructure-client';

/**
 * Reminder Container
 * 管理 Reminder 模块的依赖注入
 */
export class ReminderContainer {
  private static instance: ReminderContainer;
  private reminderApiClient: IReminderApiClient | null = null;

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
   * 重置容器（用于测试）
   */
  static resetInstance(): void {
    ReminderContainer.instance = undefined as unknown as ReminderContainer;
  }

  /**
   * 注册 Reminder API Client
   */
  registerReminderApiClient(client: IReminderApiClient): void {
    this.reminderApiClient = client;
  }

  /**
   * 获取 Reminder API Client
   */
  getReminderApiClient(): IReminderApiClient {
    if (!this.reminderApiClient) {
      throw new Error(
        'ReminderApiClient not registered. Call registerReminderApiClient() first.',
      );
    }
    return this.reminderApiClient;
  }
}
