/**
 * Task Statistics Application Service
 * 任务统计应用服务 - 负责任务相关的数据统计与分析
 * 
 * 🔄 重构说明（方案 A - 简化版）：
 * - ApplicationService 只负责 API 调用，返回数据给调用方
 * - 不再直接依赖 Store，由 Composable 层负责
 * - 直接返回数据或抛出错误（不包装 ServiceResult）
 */

import type { TaskTemplateClientDTO, TaskInstanceClientDTO, TaskDependencyServerDTO, TaskStatisticsServerDTO } from '@dailyuse/contracts/task';
import { taskStatisticsApiClient } from '../../infrastructure/api/taskApiClient';
import { useAccountStore } from '@/modules/account/presentation/stores/accountStore';

export class TaskStatisticsApplicationService {
  private static instance: TaskStatisticsApplicationService;

  private constructor() {}

  /**
   * 创建应用服务实例
   */
  static createInstance(): TaskStatisticsApplicationService {
    TaskStatisticsApplicationService.instance = new TaskStatisticsApplicationService();
    return TaskStatisticsApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static getInstance(): TaskStatisticsApplicationService {
    if (!TaskStatisticsApplicationService.instance) {
      TaskStatisticsApplicationService.instance = TaskStatisticsApplicationService.createInstance();
    }
    return TaskStatisticsApplicationService.instance;
  }

  /**
   * 懒加载获取 Account Store（只用于获取当前用户 UUID）
   */
  private get accountStore(): ReturnType<typeof useAccountStore> {
    return useAccountStore();
  }

  /**
   * 获取当前用户的 accountUuid
   */
  private getCurrentAccountUuid(): string {
    const uuid = this.accountStore.currentAccount?.uuid;
    if (!uuid) {
      throw new Error('No account UUID available');
    }
    return uuid;
  }

  /**
   * 获取任务统计数据
   * @param accountUuid 账户UUID（可选，默认使用当前用户）
   * @param forceRecalculate 是否强制重新计算
   */
  async getTaskStatistics(
    accountUuid?: string,
    forceRecalculate = false,
  ): Promise<TaskStatisticsServerDTO> {
    const uuid = accountUuid || this.getCurrentAccountUuid();
    const statistics = await taskStatisticsApiClient.getTaskStatistics(uuid, forceRecalculate);
    console.log('[TaskStatistics] 获取任务统计数据成功:', statistics);
    return statistics;
  }

  /**
   * 重新计算任务统计
   * @param accountUuid 账户UUID（可选，默认使用当前用户）
   * @param force 是否强制重算
   */
  async recalculateStatistics(
    accountUuid?: string,
    force = true,
  ): Promise<TaskStatisticsServerDTO> {
    const uuid = accountUuid || this.getCurrentAccountUuid();
    const statistics = await taskStatisticsApiClient.recalculateTaskStatistics(uuid, force);
    console.log('[TaskStatistics] 重新计算统计数据成功:', statistics);
    return statistics;
  }

  /**
   * 删除统计数据
   * @param accountUuid 账户UUID（可选，默认使用当前用户）
   */
  async deleteStatistics(accountUuid?: string): Promise<void> {
    const uuid = accountUuid || this.getCurrentAccountUuid();
    await taskStatisticsApiClient.deleteTaskStatistics(uuid);
    console.log('[TaskStatistics] 删除统计数据成功');
  }

  /**
   * 更新模板统计信息
   * @param accountUuid 账户UUID（可选，默认使用当前用户）
   */
  async updateTemplateStats(accountUuid?: string): Promise<void> {
    const uuid = accountUuid || this.getCurrentAccountUuid();
    await taskStatisticsApiClient.updateTemplateStats(uuid);
    console.log('[TaskStatistics] 更新模板统计成功');
  }

  /**
   * 更新实例统计信息
   * @param accountUuid 账户UUID（可选，默认使用当前用户）
   */
  async updateInstanceStats(accountUuid?: string): Promise<void> {
    const uuid = accountUuid || this.getCurrentAccountUuid();
    await taskStatisticsApiClient.updateInstanceStats(uuid);
    console.log('[TaskStatistics] 更新实例统计成功');
  }

  /**
   * 更新完成统计信息
   * @param accountUuid 账户UUID（可选，默认使用当前用户）
   */
  async updateCompletionStats(accountUuid?: string): Promise<void> {
    const uuid = accountUuid || this.getCurrentAccountUuid();
    await taskStatisticsApiClient.updateCompletionStats(uuid);
    console.log('[TaskStatistics] 更新完成统计成功');
  }

  /**
   * 获取今日完成率
   * @param accountUuid 账户UUID（可选，默认使用当前用户）
   */
  async getTodayCompletionRate(accountUuid?: string): Promise<number> {
    const uuid = accountUuid || this.getCurrentAccountUuid();
    const rate = await taskStatisticsApiClient.getTodayCompletionRate(uuid);
    console.log('[TaskStatistics] 获取今日完成率:', rate);
    return rate;
  }

  /**
   * 获取本周完成率
   * @param accountUuid 账户UUID（可选，默认使用当前用户）
   */
  async getWeekCompletionRate(accountUuid?: string): Promise<number> {
    const uuid = accountUuid || this.getCurrentAccountUuid();
    const rate = await taskStatisticsApiClient.getWeekCompletionRate(uuid);
    console.log('[TaskStatistics] 获取本周完成率:', rate);
    return rate;
  }

  /**
   * 获取效率趋势
   * @param accountUuid 账户UUID（可选，默认使用当前用户）
   */
  async getEfficiencyTrend(accountUuid?: string): Promise<'UP' | 'DOWN' | 'STABLE'> {
    const uuid = accountUuid || this.getCurrentAccountUuid();
    const trend = await taskStatisticsApiClient.getEfficiencyTrend(uuid);
    console.log('[TaskStatistics] 获取效率趋势:', trend);
    return trend;
  }
}

/**
 * 导出单例实例
 */
export const taskStatisticsApplicationService = TaskStatisticsApplicationService.getInstance();

