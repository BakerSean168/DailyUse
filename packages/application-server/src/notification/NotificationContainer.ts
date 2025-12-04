/**
 * Notification Module DI Container
 *
 * 依赖注入容器，管理 Notification 模块的所有仓储实例
 */

import type {
  INotificationRepository,
  INotificationTemplateRepository,
  INotificationPreferenceRepository,
} from '@dailyuse/domain-server/notification';

export class NotificationContainer {
  private static instance: NotificationContainer;

  private notificationRepository?: INotificationRepository;
  private templateRepository?: INotificationTemplateRepository;
  private preferenceRepository?: INotificationPreferenceRepository;

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

  // ===== Notification Repository =====

  registerNotificationRepository(repository: INotificationRepository): void {
    this.notificationRepository = repository;
  }

  getNotificationRepository(): INotificationRepository {
    if (!this.notificationRepository) {
      throw new Error(
        'NotificationRepository not registered. Call registerNotificationRepository() first.',
      );
    }
    return this.notificationRepository;
  }

  // ===== Template Repository =====

  registerNotificationTemplateRepository(repository: INotificationTemplateRepository): void {
    this.templateRepository = repository;
  }

  getNotificationTemplateRepository(): INotificationTemplateRepository {
    if (!this.templateRepository) {
      throw new Error(
        'NotificationTemplateRepository not registered. Call registerNotificationTemplateRepository() first.',
      );
    }
    return this.templateRepository;
  }

  // ===== Preference Repository =====

  registerNotificationPreferenceRepository(repository: INotificationPreferenceRepository): void {
    this.preferenceRepository = repository;
  }

  getNotificationPreferenceRepository(): INotificationPreferenceRepository {
    if (!this.preferenceRepository) {
      throw new Error(
        'NotificationPreferenceRepository not registered. Call registerNotificationPreferenceRepository() first.',
      );
    }
    return this.preferenceRepository;
  }

  /**
   * 重置所有仓储（用于测试）
   */
  reset(): void {
    this.notificationRepository = undefined;
    this.templateRepository = undefined;
    this.preferenceRepository = undefined;
  }
}
