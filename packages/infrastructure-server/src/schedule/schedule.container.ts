/**
 * Schedule Container (Server)
 *
 * 依赖注入容器，管理 Schedule 模块的 repository 实例
 */

import type {
  IScheduleTaskRepository,
  IScheduleStatisticsRepository,
} from '@dailyuse/domain-server/schedule';

/**
 * Schedule 模块依赖注入容器
 */
export class ScheduleContainer {
  private static instance: ScheduleContainer;
  private scheduleTaskRepository: IScheduleTaskRepository | null = null;
  private statisticsRepository: IScheduleStatisticsRepository | null = null;

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
    ScheduleContainer.instance = new ScheduleContainer();
  }

  /**
   * 注册 ScheduleTaskRepository
   */
  registerScheduleTaskRepository(repository: IScheduleTaskRepository): this {
    this.scheduleTaskRepository = repository;
    return this;
  }

  /**
   * 注册 ScheduleStatisticsRepository
   */
  registerStatisticsRepository(repository: IScheduleStatisticsRepository): this {
    this.statisticsRepository = repository;
    return this;
  }

  /**
   * 获取 ScheduleTaskRepository
   */
  getScheduleTaskRepository(): IScheduleTaskRepository {
    if (!this.scheduleTaskRepository) {
      throw new Error('ScheduleTaskRepository not registered. Call registerScheduleTaskRepository first.');
    }
    return this.scheduleTaskRepository;
  }

  /**
   * 获取 ScheduleStatisticsRepository
   */
  getStatisticsRepository(): IScheduleStatisticsRepository {
    if (!this.statisticsRepository) {
      throw new Error('ScheduleStatisticsRepository not registered. Call registerStatisticsRepository first.');
    }
    return this.statisticsRepository;
  }

  /**
   * 检查是否已配置
   */
  isConfigured(): boolean {
    return this.scheduleTaskRepository !== null && this.statisticsRepository !== null;
  }

  /**
   * 清空所有注册的依赖
   */
  clear(): void {
    this.scheduleTaskRepository = null;
    this.statisticsRepository = null;
  }
}
