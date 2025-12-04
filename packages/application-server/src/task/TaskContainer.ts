/**
 * Task Container
 *
 * 依赖注入容器，管理 Task 模块的 repository 实例
 */

import type {
  ITaskTemplateRepository,
  ITaskInstanceRepository,
} from '@dailyuse/domain-server/task';

/**
 * Task 模块依赖注入容器
 */
export class TaskContainer {
  private static instance: TaskContainer;
  private templateRepository: ITaskTemplateRepository | null = null;
  private instanceRepository: ITaskInstanceRepository | null = null;

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
  registerTemplateRepository(repository: ITaskTemplateRepository): void {
    this.templateRepository = repository;
  }

  /**
   * 注册 TaskInstanceRepository
   */
  registerInstanceRepository(repository: ITaskInstanceRepository): void {
    this.instanceRepository = repository;
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
}
