import type {
  ITaskStatisticsRepository,
} from '@dailyuse/domain-server/task';
import type {
  IGoalStatisticsRepository,
} from '@dailyuse/domain-server/goal';
import type {
  IReminderStatisticsRepository,
} from '@dailyuse/domain-server/reminder';
import type {
  IScheduleStatisticsRepository,
} from '@dailyuse/domain-server/schedule';
import type { IDashboardConfigRepository } from '@dailyuse/domain-server/dashboard';
import { TaskContainer } from '@/modules/task/infrastructure/di/TaskContainer';
import { GoalContainer } from '@/modules/goal/infrastructure/di/GoalContainer';
import { ReminderContainer } from '@/modules/reminder/infrastructure/di/ReminderContainer';
import { ScheduleContainer } from '@/modules/schedule/infrastructure/di/ScheduleContainer';
import type { StatisticsCacheService } from '../services/StatisticsCacheService';
import { prisma } from '@/config/prisma';
import { DashboardConfigPrismaRepository } from '../repositories/DashboardConfigPrismaRepository';
import { StatisticsCacheService as CacheServiceImpl } from '../services/StatisticsCacheService';

/**
 * Dashboard 模块依赖注入容器
 * 负责管理 Dashboard 相关服务的实例创建和生命周期
 *
 * 采用懒加载模式：
 * - 只在首次调用时创建实例
 * - 后续调用返回已有实例（单例）
 *
 * 支持测试替换：
 * - 允许注入 Mock 服务用于单元测试
 */
export class DashboardContainer {
  private static instance: DashboardContainer;
  private cacheService?: StatisticsCacheService;
  private configRepository?: IDashboardConfigRepository;

  private constructor() {}

  static getInstance(): DashboardContainer {
    if (!DashboardContainer.instance) {
      DashboardContainer.instance = new DashboardContainer();
    }
    return DashboardContainer.instance;
  }

  /**
   * 获取 TaskStatistics 仓储实例
   */
  getTaskStatisticsRepository(): ITaskStatisticsRepository {
    return TaskContainer.getInstance().getTaskStatisticsRepository();
  }

  /**
   * 获取 GoalStatistics 仓储实例
   */
  getGoalStatisticsRepository(): IGoalStatisticsRepository {
    return GoalContainer.getInstance().getGoalStatisticsRepository();
  }

  /**
   * 获取 ReminderStatistics 仓储实例
   */
  getReminderStatisticsRepository(): IReminderStatisticsRepository {
    return ReminderContainer.getInstance().getReminderStatisticsRepository();
  }

  /**
   * 获取 ScheduleStatistics 仓储实例
   */
  getScheduleStatisticsRepository(): IScheduleStatisticsRepository {
    return ScheduleContainer.getInstance().getScheduleStatisticsRepository();
  }

  /**
   * 获取缓存服务实例（懒加载）
   */
  getCacheService(): StatisticsCacheService {
    if (!this.cacheService) {
      this.cacheService = new CacheServiceImpl();
    }
    return this.cacheService;
  }

  /**
   * 获取 Dashboard 配置仓储实例（懒加载）
   */
  getDashboardConfigRepository(): IDashboardConfigRepository {
    if (!this.configRepository) {
      this.configRepository = new DashboardConfigPrismaRepository(prisma);
    }
    return this.configRepository;
  }

  /**
   * 设置缓存服务实例（用于测试）
   */
  setCacheService(service: StatisticsCacheService): void {
    this.cacheService = service;
  }

  /**
   * 重置容器（用于测试）
   */
  reset(): void {
    this.cacheService = undefined;
  }
}
