/**
 * Schedule Container
 *
 * Schedule 模块的依赖注入容器
 */

import type {
  IScheduleTaskApiClient,
  IScheduleEventApiClient,
} from '@dailyuse/infrastructure-client';

/**
 * Schedule Container
 * 管理 Schedule 模块的依赖注入
 */
export class ScheduleContainer {
  private static instance: ScheduleContainer;
  private scheduleTaskApiClient: IScheduleTaskApiClient | null = null;
  private scheduleEventApiClient: IScheduleEventApiClient | null = null;

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
   * 重置容器（用于测试）
   */
  static resetInstance(): void {
    ScheduleContainer.instance = undefined as unknown as ScheduleContainer;
  }

  /**
   * 注册 Schedule Task API Client
   */
  registerScheduleTaskApiClient(client: IScheduleTaskApiClient): void {
    this.scheduleTaskApiClient = client;
  }

  /**
   * 获取 Schedule Task API Client
   */
  getScheduleTaskApiClient(): IScheduleTaskApiClient {
    if (!this.scheduleTaskApiClient) {
      throw new Error(
        'ScheduleTaskApiClient not registered. Call registerScheduleTaskApiClient() first.',
      );
    }
    return this.scheduleTaskApiClient;
  }

  /**
   * 注册 Schedule Event API Client
   */
  registerScheduleEventApiClient(client: IScheduleEventApiClient): void {
    this.scheduleEventApiClient = client;
  }

  /**
   * 获取 Schedule Event API Client
   */
  getScheduleEventApiClient(): IScheduleEventApiClient {
    if (!this.scheduleEventApiClient) {
      throw new Error(
        'ScheduleEventApiClient not registered. Call registerScheduleEventApiClient() first.',
      );
    }
    return this.scheduleEventApiClient;
  }
}
