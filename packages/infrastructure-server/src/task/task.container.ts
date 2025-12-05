/**
 * Task Container (Server)
 *
 * 依赖注入容器，管理 Task 模块的 repository 实例
 */

import type {
  ITaskTemplateRepository,
  ITaskInstanceRepository,
  ITaskStatisticsRepository,
} from '@dailyuse/domain-server/task';

/**
 * Task 模块依赖注入容器
 */
export class TaskContainer {
  private static instance: TaskContainer;
  private templateRepository: ITaskTemplateRepository | null = null;
  private instanceRepository: ITaskInstanceRepository | null = null;
  private statisticsRepository: ITaskStatisticsRepository | null = null;

  private constructor() {}

  /**
   * 获取容器单例
   */
  static getInstance(): TaskContainer {
    if (!TaskContainer.instance) {
      TaskContainer.instance = new TaskContainer();
    }
    return TaskContainer.instance;
  }

  /**
   * 重置容器（用于测试）
   */
  static resetInstance(): void {
    TaskContainer.instance = new TaskContainer();
  }

  /**
   * 注册 TaskTemplateRepository
   */
  registerTemplateRepository(repository: ITaskTemplateRepository): this {
    this.templateRepository = repository;
    return this;
  }

  /**
   * 注册 TaskInstanceRepository
   */
  registerInstanceRepository(repository: ITaskInstanceRepository): this {
    this.instanceRepository = repository;
    return this;
  }

  /**
   * 注册 TaskStatisticsRepository
   */
  registerStatisticsRepository(repository: ITaskStatisticsRepository): this {
    this.statisticsRepository = repository;
    return this;
  }

  /**
   * 获取 TaskTemplateRepository
   */
  getTemplateRepository(): ITaskTemplateRepository {
    if (!this.templateRepository) {
      throw new Error('TaskTemplateRepository not registered. Call registerTemplateRepository first.');
    }
    return this.templateRepository;
  }

  /**
   * 获取 TaskInstanceRepository
   */
  getInstanceRepository(): ITaskInstanceRepository {
    if (!this.instanceRepository) {
      throw new Error('TaskInstanceRepository not registered. Call registerInstanceRepository first.');
    }
    return this.instanceRepository;
  }

  /**
   * 获取 TaskStatisticsRepository
   */
  getStatisticsRepository(): ITaskStatisticsRepository {
    if (!this.statisticsRepository) {
      throw new Error('TaskStatisticsRepository not registered. Call registerStatisticsRepository first.');
    }
    return this.statisticsRepository;
  }

  /**
   * 检查是否已配置
   */
  isConfigured(): boolean {
    return this.templateRepository !== null && this.instanceRepository !== null;
  }

  /**
   * 清空所有注册的依赖
   */
  clear(): void {
    this.templateRepository = null;
    this.instanceRepository = null;
    this.statisticsRepository = null;
  }
}
