/**
 * Task Container
 *
 * Task 模块的依赖注入容器
 */

import type {
  ITaskTemplateApiClient,
  ITaskInstanceApiClient,
  ITaskDependencyApiClient,
  ITaskStatisticsApiClient,
} from '@dailyuse/infrastructure-client';

/**
 * Task Container
 * 管理 Task 模块的依赖注入
 */
export class TaskContainer {
  private static instance: TaskContainer;
  private taskTemplateApiClient: ITaskTemplateApiClient | null = null;
  private taskInstanceApiClient: ITaskInstanceApiClient | null = null;
  private taskDependencyApiClient: ITaskDependencyApiClient | null = null;
  private taskStatisticsApiClient: ITaskStatisticsApiClient | null = null;

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
    TaskContainer.instance = undefined as unknown as TaskContainer;
  }

  /**
   * 注册 Task Template API Client
   */
  registerTaskTemplateApiClient(client: ITaskTemplateApiClient): void {
    this.taskTemplateApiClient = client;
  }

  /**
   * 获取 Task Template API Client
   */
  getTaskTemplateApiClient(): ITaskTemplateApiClient {
    if (!this.taskTemplateApiClient) {
      throw new Error(
        'TaskTemplateApiClient not registered. Call registerTaskTemplateApiClient() first.',
      );
    }
    return this.taskTemplateApiClient;
  }

  /**
   * 注册 Task Instance API Client
   */
  registerTaskInstanceApiClient(client: ITaskInstanceApiClient): void {
    this.taskInstanceApiClient = client;
  }

  /**
   * 获取 Task Instance API Client
   */
  getTaskInstanceApiClient(): ITaskInstanceApiClient {
    if (!this.taskInstanceApiClient) {
      throw new Error(
        'TaskInstanceApiClient not registered. Call registerTaskInstanceApiClient() first.',
      );
    }
    return this.taskInstanceApiClient;
  }

  /**
   * 注册 Task Dependency API Client
   */
  registerTaskDependencyApiClient(client: ITaskDependencyApiClient): void {
    this.taskDependencyApiClient = client;
  }

  /**
   * 获取 Task Dependency API Client
   */
  getTaskDependencyApiClient(): ITaskDependencyApiClient {
    if (!this.taskDependencyApiClient) {
      throw new Error(
        'TaskDependencyApiClient not registered. Call registerTaskDependencyApiClient() first.',
      );
    }
    return this.taskDependencyApiClient;
  }

  /**
   * 注册 Task Statistics API Client
   */
  registerTaskStatisticsApiClient(client: ITaskStatisticsApiClient): void {
    this.taskStatisticsApiClient = client;
  }

  /**
   * 获取 Task Statistics API Client
   */
  getTaskStatisticsApiClient(): ITaskStatisticsApiClient {
    if (!this.taskStatisticsApiClient) {
      throw new Error(
        'TaskStatisticsApiClient not registered. Call registerTaskStatisticsApiClient() first.',
      );
    }
    return this.taskStatisticsApiClient;
  }
}
