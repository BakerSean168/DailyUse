/**
 * Reminder Container (Server)
 *
 * 依赖注入容器，管理 Reminder 模块的 repository 实例
 */

import type {
  IReminderTemplateRepository,
  IReminderGroupRepository,
  IReminderStatisticsRepository,
} from '@dailyuse/domain-server/reminder';

/**
 * Reminder 模块依赖注入容器
 */
export class ReminderContainer {
  private static instance: ReminderContainer;
  private templateRepository: IReminderTemplateRepository | null = null;
  private groupRepository: IReminderGroupRepository | null = null;
  private statisticsRepository: IReminderStatisticsRepository | null = null;

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
    ReminderContainer.instance = new ReminderContainer();
  }

  /**
   * 注册 ReminderTemplateRepository
   */
  registerTemplateRepository(repository: IReminderTemplateRepository): this {
    this.templateRepository = repository;
    return this;
  }

  /**
   * 注册 ReminderGroupRepository
   */
  registerGroupRepository(repository: IReminderGroupRepository): this {
    this.groupRepository = repository;
    return this;
  }

  /**
   * 注册 ReminderStatisticsRepository
   */
  registerStatisticsRepository(repository: IReminderStatisticsRepository): this {
    this.statisticsRepository = repository;
    return this;
  }

  /**
   * 获取 ReminderTemplateRepository
   */
  getTemplateRepository(): IReminderTemplateRepository {
    if (!this.templateRepository) {
      throw new Error('ReminderTemplateRepository not registered. Call registerTemplateRepository first.');
    }
    return this.templateRepository;
  }

  /**
   * 获取 ReminderGroupRepository
   */
  getGroupRepository(): IReminderGroupRepository {
    if (!this.groupRepository) {
      throw new Error('ReminderGroupRepository not registered. Call registerGroupRepository first.');
    }
    return this.groupRepository;
  }

  /**
   * 获取 ReminderStatisticsRepository
   */
  getStatisticsRepository(): IReminderStatisticsRepository {
    if (!this.statisticsRepository) {
      throw new Error('ReminderStatisticsRepository not registered. Call registerStatisticsRepository first.');
    }
    return this.statisticsRepository;
  }

  /**
   * 检查是否已配置
   */
  isConfigured(): boolean {
    return this.templateRepository !== null && this.groupRepository !== null;
  }

  /**
   * 清空所有注册的依赖
   */
  clear(): void {
    this.templateRepository = null;
    this.groupRepository = null;
    this.statisticsRepository = null;
  }
}
