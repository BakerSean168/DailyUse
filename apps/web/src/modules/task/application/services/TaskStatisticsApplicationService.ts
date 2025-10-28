/**
 * Task Statistics Application Service
 * 任务统计应用服务 - 负责任务相关的数据统计与分析
 */

import type { TaskContracts } from '@dailyuse/contracts';
import { taskStatisticsApiClient } from '../../infrastructure/api/taskApiClient';
import { useTaskStore } from '../../presentation/stores/taskStore';
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
   * 懒加载获取 Task Store
   */
  private get taskStore(): ReturnType<typeof useTaskStore> {
    return useTaskStore();
  }

  /**
   * 懒加载获取 Account Store
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
  ): Promise<TaskContracts.TaskStatisticsServerDTO> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const uuid = accountUuid || this.getCurrentAccountUuid();
      const statistics = await taskStatisticsApiClient.getTaskStatistics(uuid, forceRecalculate);

      console.log('[TaskStatistics] 获取任务统计数据成功:', statistics);
      return statistics;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取任务统计数据失败';
      this.taskStore.setError(errorMessage);
      console.error('❌ [TaskStatistics] 获取任务统计数据失败:', error);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 重新计算任务统计
   * @param accountUuid 账户UUID（可选，默认使用当前用户）
   * @param force 是否强制重算
   */
  async recalculateStatistics(
    accountUuid?: string,
    force = true,
  ): Promise<TaskContracts.TaskStatisticsServerDTO> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const uuid = accountUuid || this.getCurrentAccountUuid();
      const statistics = await taskStatisticsApiClient.recalculateTaskStatistics(uuid, force);

      console.log('[TaskStatistics] 重新计算统计数据成功:', statistics);
      return statistics;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '重新计算统计数据失败';
      this.taskStore.setError(errorMessage);
      console.error('❌ [TaskStatistics] 重新计算统计数据失败:', error);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 删除统计数据
   * @param accountUuid 账户UUID（可选，默认使用当前用户）
   */
  async deleteStatistics(accountUuid?: string): Promise<void> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const uuid = accountUuid || this.getCurrentAccountUuid();
      await taskStatisticsApiClient.deleteTaskStatistics(uuid);

      console.log('[TaskStatistics] 删除统计数据成功');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除统计数据失败';
      this.taskStore.setError(errorMessage);
      console.error('❌ [TaskStatistics] 删除统计数据失败:', error);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 更新模板统计信息
   * @param accountUuid 账户UUID（可选，默认使用当前用户）
   */
  async updateTemplateStats(accountUuid?: string): Promise<void> {
    try {
      const uuid = accountUuid || this.getCurrentAccountUuid();
      await taskStatisticsApiClient.updateTemplateStats(uuid);
      console.log('[TaskStatistics] 更新模板统计成功');
    } catch (error) {
      console.error('❌ [TaskStatistics] 更新模板统计失败:', error);
      throw error;
    }
  }

  /**
   * 更新实例统计信息
   * @param accountUuid 账户UUID（可选，默认使用当前用户）
   */
  async updateInstanceStats(accountUuid?: string): Promise<void> {
    try {
      const uuid = accountUuid || this.getCurrentAccountUuid();
      await taskStatisticsApiClient.updateInstanceStats(uuid);
      console.log('[TaskStatistics] 更新实例统计成功');
    } catch (error) {
      console.error('❌ [TaskStatistics] 更新实例统计失败:', error);
      throw error;
    }
  }

  /**
   * 更新完成统计信息
   * @param accountUuid 账户UUID（可选，默认使用当前用户）
   */
  async updateCompletionStats(accountUuid?: string): Promise<void> {
    try {
      const uuid = accountUuid || this.getCurrentAccountUuid();
      await taskStatisticsApiClient.updateCompletionStats(uuid);
      console.log('[TaskStatistics] 更新完成统计成功');
    } catch (error) {
      console.error('❌ [TaskStatistics] 更新完成统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取今日完成率
   * @param accountUuid 账户UUID（可选，默认使用当前用户）
   */
  async getTodayCompletionRate(accountUuid?: string): Promise<number> {
    try {
      const uuid = accountUuid || this.getCurrentAccountUuid();
      const rate = await taskStatisticsApiClient.getTodayCompletionRate(uuid);
      console.log('[TaskStatistics] 获取今日完成率:', rate);
      return rate;
    } catch (error) {
      console.error('❌ [TaskStatistics] 获取今日完成率失败:', error);
      throw error;
    }
  }

  /**
   * 获取本周完成率
   * @param accountUuid 账户UUID（可选，默认使用当前用户）
   */
  async getWeekCompletionRate(accountUuid?: string): Promise<number> {
    try {
      const uuid = accountUuid || this.getCurrentAccountUuid();
      const rate = await taskStatisticsApiClient.getWeekCompletionRate(uuid);
      console.log('[TaskStatistics] 获取本周完成率:', rate);
      return rate;
    } catch (error) {
      console.error('❌ [TaskStatistics] 获取本周完成率失败:', error);
      throw error;
    }
  }

  /**
   * 获取效率趋势
   * @param accountUuid 账户UUID（可选，默认使用当前用户）
   */
  async getEfficiencyTrend(accountUuid?: string): Promise<'UP' | 'DOWN' | 'STABLE'> {
    try {
      const uuid = accountUuid || this.getCurrentAccountUuid();
      const trend = await taskStatisticsApiClient.getEfficiencyTrend(uuid);
      console.log('[TaskStatistics] 获取效率趋势:', trend);
      return trend;
    } catch (error) {
      console.error('❌ [TaskStatistics] 获取效率趋势失败:', error);
      throw error;
    }
  }
}

/**
 * 导出单例实例
 */
export const taskStatisticsApplicationService = TaskStatisticsApplicationService.getInstance();
