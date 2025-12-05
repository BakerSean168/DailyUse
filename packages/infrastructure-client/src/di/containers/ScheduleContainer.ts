/**
 * Schedule Container
 *
 * Schedule 模块的依赖容器
 */

import type { IScheduleTaskApiClient, IScheduleEventApiClient } from '../../schedule';
import { DIContainer } from './DIContainer';
import { DependencyKeys } from './dependency-keys';

/**
 * Schedule 依赖容器
 */
export class ScheduleContainer {
  private static instance: ScheduleContainer;

  private constructor() {}

  /**
   * 获取容器单例
   */
  static getInstance(): ScheduleContainer {
    if (!ScheduleContainer.instance) {
      ScheduleContainer.instance = new ScheduleContainer();
    }
    return ScheduleContainer.instance;
  }

  /**
   * 重置容器
   */
  static resetInstance(): void {
    ScheduleContainer.instance = undefined as unknown as ScheduleContainer;
  }

  /**
   * 注册 Schedule Task API Client
   */
  registerScheduleTaskApiClient(client: IScheduleTaskApiClient): void {
    DIContainer.getInstance().register(DependencyKeys.SCHEDULE_TASK_API_CLIENT, client);
  }

  /**
   * 获取 Schedule Task API Client
   */
  getScheduleTaskApiClient(): IScheduleTaskApiClient {
    return DIContainer.getInstance().resolve<IScheduleTaskApiClient>(DependencyKeys.SCHEDULE_TASK_API_CLIENT);
  }

  /**
   * 注册 Schedule Event API Client
   */
  registerScheduleEventApiClient(client: IScheduleEventApiClient): void {
    DIContainer.getInstance().register(DependencyKeys.SCHEDULE_EVENT_API_CLIENT, client);
  }

  /**
   * 获取 Schedule Event API Client
   */
  getScheduleEventApiClient(): IScheduleEventApiClient {
    return DIContainer.getInstance().resolve<IScheduleEventApiClient>(DependencyKeys.SCHEDULE_EVENT_API_CLIENT);
  }
}
