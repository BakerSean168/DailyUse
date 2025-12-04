/**
 * Schedule Container
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
  registerScheduleTaskRepository(repository: IScheduleTaskRepository): void {
    this.scheduleTaskRepository = repository;
  }

  /**
   * 注册 ScheduleStatisticsRepository
   */
  registerStatisticsRepository(repository: IScheduleStatisticsRepository): void {
    this.statisticsRepository = repository;
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
}
