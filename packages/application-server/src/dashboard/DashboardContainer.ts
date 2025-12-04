/**
 * Dashboard Module DI Container
 *
 * 依赖注入容器，管理 Dashboard 模块的所有仓储和服务实例
 */

import type { ITaskStatisticsRepository } from '@dailyuse/domain-server/task';
import type { IGoalStatisticsRepository } from '@dailyuse/domain-server/goal';
import type { IReminderStatisticsRepository } from '@dailyuse/domain-server/reminder';
import type { IScheduleStatisticsRepository } from '@dailyuse/domain-server/schedule';
import type { IDashboardConfigRepository } from '@dailyuse/domain-server/dashboard';

/**
 * 统计缓存服务接口
 */
export interface IStatisticsCacheService {
  get(accountUuid: string): Promise<any | null>;
  set(accountUuid: string, data: any): Promise<void>;
  invalidate(accountUuid: string): Promise<void>;
}

export class DashboardContainer {
  private static instance: DashboardContainer;

  private taskStatisticsRepository?: ITaskStatisticsRepository;
  private goalStatisticsRepository?: IGoalStatisticsRepository;
  private reminderStatisticsRepository?: IReminderStatisticsRepository;
  private scheduleStatisticsRepository?: IScheduleStatisticsRepository;
  private dashboardConfigRepository?: IDashboardConfigRepository;
  private cacheService?: IStatisticsCacheService;

  private constructor() {}

  /**
   * 获取容器单例
   */
  static getInstance(): DashboardContainer {
    if (!DashboardContainer.instance) {
      DashboardContainer.instance = new DashboardContainer();
    }
    return DashboardContainer.instance;
  }

  /**
   * 重置容器（用于测试）
   */
  static resetInstance(): void {
    DashboardContainer.instance = undefined as unknown as DashboardContainer;
  }

  // ===== Task Statistics =====

  registerTaskStatisticsRepository(repository: ITaskStatisticsRepository): void {
    this.taskStatisticsRepository = repository;
  }

  getTaskStatisticsRepository(): ITaskStatisticsRepository {
    if (!this.taskStatisticsRepository) {
      throw new Error(
        'TaskStatisticsRepository not registered. Call registerTaskStatisticsRepository() first.',
      );
    }
    return this.taskStatisticsRepository;
  }

  // ===== Goal Statistics =====

  registerGoalStatisticsRepository(repository: IGoalStatisticsRepository): void {
    this.goalStatisticsRepository = repository;
  }

  getGoalStatisticsRepository(): IGoalStatisticsRepository {
    if (!this.goalStatisticsRepository) {
      throw new Error(
        'GoalStatisticsRepository not registered. Call registerGoalStatisticsRepository() first.',
      );
    }
    return this.goalStatisticsRepository;
  }

  // ===== Reminder Statistics =====

  registerReminderStatisticsRepository(repository: IReminderStatisticsRepository): void {
    this.reminderStatisticsRepository = repository;
  }

  getReminderStatisticsRepository(): IReminderStatisticsRepository {
    if (!this.reminderStatisticsRepository) {
      throw new Error(
        'ReminderStatisticsRepository not registered. Call registerReminderStatisticsRepository() first.',
      );
    }
    return this.reminderStatisticsRepository;
  }

  // ===== Schedule Statistics =====

  registerScheduleStatisticsRepository(repository: IScheduleStatisticsRepository): void {
    this.scheduleStatisticsRepository = repository;
  }

  getScheduleStatisticsRepository(): IScheduleStatisticsRepository {
    if (!this.scheduleStatisticsRepository) {
      throw new Error(
        'ScheduleStatisticsRepository not registered. Call registerScheduleStatisticsRepository() first.',
      );
    }
    return this.scheduleStatisticsRepository;
  }

  // ===== Dashboard Config =====

  registerDashboardConfigRepository(repository: IDashboardConfigRepository): void {
    this.dashboardConfigRepository = repository;
  }

  getDashboardConfigRepository(): IDashboardConfigRepository {
    if (!this.dashboardConfigRepository) {
      throw new Error(
        'DashboardConfigRepository not registered. Call registerDashboardConfigRepository() first.',
      );
    }
    return this.dashboardConfigRepository;
  }

  // ===== Cache Service =====

  registerCacheService(service: IStatisticsCacheService): void {
    this.cacheService = service;
  }

  getCacheService(): IStatisticsCacheService {
    if (!this.cacheService) {
      throw new Error('CacheService not registered. Call registerCacheService() first.');
    }
    return this.cacheService;
  }

  /**
   * 重置所有仓储和服务（用于测试）
   */
  reset(): void {
    this.taskStatisticsRepository = undefined;
    this.goalStatisticsRepository = undefined;
    this.reminderStatisticsRepository = undefined;
    this.scheduleStatisticsRepository = undefined;
    this.dashboardConfigRepository = undefined;
    this.cacheService = undefined;
  }
}
