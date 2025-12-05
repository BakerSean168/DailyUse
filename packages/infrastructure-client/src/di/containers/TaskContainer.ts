/**
 * Task Container
 *
 * Task 模块的依赖容器
 */

import type {
  ITaskTemplateApiClient,
  ITaskInstanceApiClient,
  ITaskDependencyApiClient,
  ITaskStatisticsApiClient,
} from '../../task';
import { DIContainer } from './DIContainer';
import { DependencyKeys } from './dependency-keys';

/**
 * Task 依赖容器
 */
export class TaskContainer {
  private static instance: TaskContainer;

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
   * 重置容器
   */
  static resetInstance(): void {
    TaskContainer.instance = undefined as unknown as TaskContainer;
  }

  /**
   * 注册 Task Template API Client
   */
  registerTaskTemplateApiClient(client: ITaskTemplateApiClient): void {
    DIContainer.getInstance().register(DependencyKeys.TASK_TEMPLATE_API_CLIENT, client);
  }

  /**
   * 获取 Task Template API Client
   */
  getTaskTemplateApiClient(): ITaskTemplateApiClient {
    return DIContainer.getInstance().resolve<ITaskTemplateApiClient>(DependencyKeys.TASK_TEMPLATE_API_CLIENT);
  }

  /**
   * 注册 Task Instance API Client
   */
  registerTaskInstanceApiClient(client: ITaskInstanceApiClient): void {
    DIContainer.getInstance().register(DependencyKeys.TASK_INSTANCE_API_CLIENT, client);
  }

  /**
   * 获取 Task Instance API Client
   */
  getTaskInstanceApiClient(): ITaskInstanceApiClient {
    return DIContainer.getInstance().resolve<ITaskInstanceApiClient>(DependencyKeys.TASK_INSTANCE_API_CLIENT);
  }

  /**
   * 注册 Task Dependency API Client
   */
  registerTaskDependencyApiClient(client: ITaskDependencyApiClient): void {
    DIContainer.getInstance().register(DependencyKeys.TASK_DEPENDENCY_API_CLIENT, client);
  }

  /**
   * 获取 Task Dependency API Client
   */
  getTaskDependencyApiClient(): ITaskDependencyApiClient {
    return DIContainer.getInstance().resolve<ITaskDependencyApiClient>(DependencyKeys.TASK_DEPENDENCY_API_CLIENT);
  }

  /**
   * 注册 Task Statistics API Client
   */
  registerTaskStatisticsApiClient(client: ITaskStatisticsApiClient): void {
    DIContainer.getInstance().register(DependencyKeys.TASK_STATISTICS_API_CLIENT, client);
  }

  /**
   * 获取 Task Statistics API Client
   */
  getTaskStatisticsApiClient(): ITaskStatisticsApiClient {
    return DIContainer.getInstance().resolve<ITaskStatisticsApiClient>(DependencyKeys.TASK_STATISTICS_API_CLIENT);
  }
}
