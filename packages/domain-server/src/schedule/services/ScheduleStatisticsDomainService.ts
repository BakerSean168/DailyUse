/**
 * ScheduleStatisticsDomainService - Domain Service
 * 调度统计领域服务
 *
 * DDD Domain Service:
 * - 处理统计数据的业务逻辑
 * - 协调统计数据的计算和更新
 * - 不持有状态，只提供行为
 *
 * 职责:
 * - 统计数据初始化
 * - 统计数据查询和聚合
 * - 统计数据重置
 * - 模块级别统计管理
 *
 * @domain-server/schedule
 */

import type { ScheduleStatistics } from '../aggregates/ScheduleStatistics';
import type { IScheduleStatisticsRepository } from '../repositories/IScheduleStatisticsRepository';
import type { IScheduleTaskRepository } from '../repositories/IScheduleTaskRepository';
import { ScheduleContracts, SourceModule, ScheduleTaskStatus } from '@dailyuse/contracts';

/**
 * 模块统计查询结果
 */
export interface IModuleStatisticsResult {
  module: SourceModule;
  totalTasks: number;
  activeTasks: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRate: number;
}

/**
 * 调度统计领域服务
 */
export class ScheduleStatisticsDomainService {
  constructor(
    private readonly scheduleStatisticsRepository: IScheduleStatisticsRepository,
    private readonly scheduleTaskRepository: IScheduleTaskRepository,
  ) {}

  // ============ 统计数据初始化 ============

  /**
   * 为账户初始化统计数据（如果不存在）
   */
  async ensureStatisticsExists(accountUuid: string): Promise<ScheduleStatistics> {
    return this.scheduleStatisticsRepository.getOrCreate(accountUuid);
  }

  /**
   * 重新计算账户的统计数据（从任务数据重建）
   */
  async recalculateStatistics(accountUuid: string): Promise<ScheduleStatistics> {
    // 获取或创建统计
    const statistics = await this.scheduleStatisticsRepository.getOrCreate(accountUuid);

    // 重置统计
    statistics.resetAllStats();

    // 查询所有任务
    const tasks = await this.scheduleTaskRepository.findByAccountUuid(accountUuid);

    // 重新计算
    for (const task of tasks) {
      // 任务计数
      statistics.incrementTaskCount(task.status);

      // 状态计数
      switch (task.status) {
        case 'paused':
          statistics.incrementPausedTasks(task.sourceModule);
          break;
        case 'completed':
          statistics.incrementCompletedTasks(task.sourceModule, false);
          break;
        case 'failed':
          statistics.incrementFailedTasks(task.sourceModule, false);
          break;
      }

      // 执行统计（从任务的执行记录中统计）
      const executions = task.executions;
      if (executions) {
        for (const execution of executions) {
          statistics.recordExecution(execution.status, execution.duration || 0, task.sourceModule);
        }
      }
    }

    // 保存统计
    await this.scheduleStatisticsRepository.save(statistics);

    return statistics;
  }

  // ============ 统计数据查询 ============

  /**
   * 获取账户的统计数据
   */
  async getStatistics(accountUuid: string): Promise<ScheduleStatistics | null> {
    return this.scheduleStatisticsRepository.findByAccountUuid(accountUuid);
  }

  /**
   * 获取模块级别的统计数据
   */
  async getModuleStatistics(
    accountUuid: string,
    module: SourceModule,
  ): Promise<IModuleStatisticsResult | null> {
    const statistics = await this.scheduleStatisticsRepository.findByAccountUuid(accountUuid);
    if (!statistics) {
      return null;
    }

    const moduleStats = statistics.getModuleStats(module);
    if (!moduleStats) {
      return null;
    }

    // 计算成功率
    const successRate =
      moduleStats.totalExecutions > 0
        ? moduleStats.successfulExecutions / moduleStats.totalExecutions
        : 0;

    return {
      module,
      totalTasks: moduleStats.totalTasks ?? 0,
      activeTasks: moduleStats.activeTasks ?? 0,
      totalExecutions: moduleStats.totalExecutions ?? 0,
      successfulExecutions: moduleStats.successfulExecutions ?? 0,
      failedExecutions: moduleStats.failedExecutions ?? 0,
      successRate,
    };
  }

  /**
   * 获取所有模块的统计数据
   */
  async getAllModuleStatistics(accountUuid: string): Promise<IModuleStatisticsResult[]> {
    const statistics = await this.scheduleStatisticsRepository.findByAccountUuid(accountUuid);
    if (!statistics) {
      return [];
    }

    const modules: SourceModule[] = [
      SourceModule.REMINDER,
      SourceModule.TASK,
      SourceModule.GOAL,
      SourceModule.NOTIFICATION,
    ];
    const results: IModuleStatisticsResult[] = [];

    for (const module of modules) {
      const moduleStats = statistics.getModuleStats(module);
      if (moduleStats) {
        // 计算成功率
        const successRate =
          (moduleStats.totalExecutions ?? 0) > 0
            ? (moduleStats.successfulExecutions ?? 0) / (moduleStats.totalExecutions ?? 0)
            : 0;

        results.push({
          module,
          totalTasks: moduleStats.totalTasks ?? 0,
          activeTasks: moduleStats.activeTasks ?? 0,
          totalExecutions: moduleStats.totalExecutions ?? 0,
          successfulExecutions: moduleStats.successfulExecutions ?? 0,
          failedExecutions: moduleStats.failedExecutions ?? 0,
          successRate,
        });
      }
    }

    return results;
  }

  // ============ 统计数据管理 ============

  /**
   * 重置账户的统计数据
   */
  async resetStatistics(accountUuid: string): Promise<void> {
    const statistics = await this.scheduleStatisticsRepository.getOrCreate(accountUuid);
    statistics.resetAllStats();
    await this.scheduleStatisticsRepository.save(statistics);
  }

  /**
   * 删除账户的统计数据
   */
  async deleteStatistics(accountUuid: string): Promise<void> {
    await this.scheduleStatisticsRepository.deleteByAccountUuid(accountUuid);
  }

  // ============ 批量操作 ============

  /**
   * 批量重新计算统计数据
   */
  async recalculateStatisticsBatch(accountUuids: string[]): Promise<ScheduleStatistics[]> {
    const results: ScheduleStatistics[] = [];

    for (const accountUuid of accountUuids) {
      const statistics = await this.recalculateStatistics(accountUuid);
      results.push(statistics);
    }

    return results;
  }

  /**
   * 批量重置统计数据
   */
  async resetStatisticsBatch(accountUuids: string[]): Promise<void> {
    const statisticsList: ScheduleStatistics[] = [];

    for (const accountUuid of accountUuids) {
      const statistics = await this.scheduleStatisticsRepository.getOrCreate(accountUuid);
      statistics.resetAllStats();
      statisticsList.push(statistics);
    }

    await this.scheduleStatisticsRepository.saveBatch(statisticsList);
  }
}
