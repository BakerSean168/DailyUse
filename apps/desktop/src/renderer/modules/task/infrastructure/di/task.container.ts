/**
 * Task Container - Task 模块 DI 容器
 * 
 * @module renderer/modules/task/infrastructure/di
 */

import {
  RendererContainer,
  createServiceToken,
  ModuleName,
} from '@/renderer/shared/infrastructure/di';

import {
  TaskTemplateIPCClient,
  taskTemplateIPCClient,
  TaskInstanceIPCClient,
  taskInstanceIPCClient,
  TaskStatisticsIPCClient,
  taskStatisticsIPCClient,
} from '../ipc';

// ============ Service Tokens ============

export const TaskTokens = {
  TemplateClient: createServiceToken<TaskTemplateIPCClient>('task:template-client'),
  InstanceClient: createServiceToken<TaskInstanceIPCClient>('task:instance-client'),
  StatisticsClient: createServiceToken<TaskStatisticsIPCClient>('task:statistics-client'),
} as const;

// ============ Task Container ============

/**
 * Task 模块容器
 */
export class TaskContainer extends RendererContainer {
  readonly moduleName = ModuleName.Task;

  protected registerServices(): void {
    // 注册 IPC Clients（使用单例）
    this.registerInstance(TaskTokens.TemplateClient, taskTemplateIPCClient);
    this.registerInstance(TaskTokens.InstanceClient, taskInstanceIPCClient);
    this.registerInstance(TaskTokens.StatisticsClient, taskStatisticsIPCClient);
  }

  // ============ Convenience Getters ============

  /**
   * 获取 Template Client
   */
  get templateClient(): TaskTemplateIPCClient {
    return this.get(TaskTokens.TemplateClient);
  }

  /**
   * 获取 Instance Client
   */
  get instanceClient(): TaskInstanceIPCClient {
    return this.get(TaskTokens.InstanceClient);
  }

  /**
   * 获取 Statistics Client
   */
  get statisticsClient(): TaskStatisticsIPCClient {
    return this.get(TaskTokens.StatisticsClient);
  }
}

// ============ Singleton Export ============

export const taskContainer = new TaskContainer();
