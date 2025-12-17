/**
 * Task Statistics IPC Client - Task 统计 IPC 客户端
 * 
 * @module renderer/modules/task/infrastructure/ipc
 */

import { BaseIPCClient, ipcClient } from '@/renderer/shared/infrastructure/ipc';
import { TaskChannels } from '@/shared/types/ipc-channels';
import type { TaskPayloads } from '@/shared/types/ipc-payloads';

// ============ Types from contracts ============
// Re-export from contracts for convenience
export type {
  TaskStatisticsClientDTO,
} from '@dailyuse/contracts/task';

// Import types for internal use
import type {
  TaskStatisticsClientDTO,
} from '@dailyuse/contracts/task';

// ============ Local Type Aliases (backward compatibility) ============

/**
 * TaskStatisticsDTO 别名 - 用于 IPC 传输
 */
export type TaskStatisticsDTO = TaskStatisticsClientDTO;

export interface DailyTaskStatistics {
  date: string; // YYYY-MM-DD
  total: number;
  completed: number;
  skipped: number;
  completionRate: number;
}

export interface WeeklyTaskStatistics {
  weekStart: string; // YYYY-MM-DD
  weekEnd: string;
  dailyStats: DailyTaskStatistics[];
  summary: TaskStatisticsDTO;
}

export interface MonthlyTaskStatistics {
  month: string; // YYYY-MM
  weeklyStats: WeeklyTaskStatistics[];
  summary: TaskStatisticsDTO;
}

export interface TaskTrendData {
  labels: string[];
  completed: number[];
  total: number[];
}

// ============ Task Statistics IPC Client ============

/**
 * Task Statistics IPC Client
 */
export class TaskStatisticsIPCClient {
  private client: BaseIPCClient;

  constructor(client: BaseIPCClient = ipcClient) {
    this.client = client;
  }

  // ============ Statistics ============

  /**
   * 获取指定日期范围的统计
   */
  async get(params: TaskPayloads.StatisticsRequest): Promise<TaskStatisticsDTO> {
    return this.client.invoke<TaskStatisticsDTO>(
      TaskChannels.STATISTICS_GET,
      params
    );
  }

  /**
   * 获取每日统计
   */
  async getDaily(
    accountUuid: string,
    date: Date = new Date()
  ): Promise<DailyTaskStatistics> {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;

    return this.client.invoke<DailyTaskStatistics>(
      TaskChannels.STATISTICS_DAILY,
      { accountUuid, startDate: startOfDay, endDate: endOfDay }
    );
  }

  /**
   * 获取每周统计
   */
  async getWeekly(
    accountUuid: string,
    weekStart?: Date
  ): Promise<WeeklyTaskStatistics> {
    const now = weekStart ?? new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek).getTime();
    const endOfWeek = startOfWeek + 7 * 24 * 60 * 60 * 1000 - 1;

    return this.client.invoke<WeeklyTaskStatistics>(
      TaskChannels.STATISTICS_WEEKLY,
      { accountUuid, startDate: startOfWeek, endDate: endOfWeek }
    );
  }

  /**
   * 获取每月统计
   */
  async getMonthly(
    accountUuid: string,
    year?: number,
    month?: number
  ): Promise<MonthlyTaskStatistics> {
    const now = new Date();
    const y = year ?? now.getFullYear();
    const m = month ?? now.getMonth();
    const startOfMonth = new Date(y, m, 1).getTime();
    const endOfMonth = new Date(y, m + 1, 0, 23, 59, 59, 999).getTime();

    return this.client.invoke<MonthlyTaskStatistics>(
      TaskChannels.STATISTICS_MONTHLY,
      { accountUuid, startDate: startOfMonth, endDate: endOfMonth }
    );
  }

  // ============ Convenience Methods ============

  /**
   * 获取今日统计
   */
  async getToday(accountUuid: string): Promise<DailyTaskStatistics> {
    return this.getDaily(accountUuid, new Date());
  }

  /**
   * 获取本周统计
   */
  async getThisWeek(accountUuid: string): Promise<WeeklyTaskStatistics> {
    return this.getWeekly(accountUuid, new Date());
  }

  /**
   * 获取本月统计
   */
  async getThisMonth(accountUuid: string): Promise<MonthlyTaskStatistics> {
    const now = new Date();
    return this.getMonthly(accountUuid, now.getFullYear(), now.getMonth());
  }

  /**
   * 获取过去 N 天的趋势数据
   */
  async getTrend(accountUuid: string, days = 7): Promise<TaskTrendData> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const stats = await this.get({
      accountUuid,
      startDate: startDate.getTime(),
      endDate: endDate.getTime(),
    });

    // 这里简化处理，实际可能需要更详细的 API
    const labels: string[] = [];
    const completed: number[] = [];
    const total: number[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      labels.push(date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }));
      // 从嵌套结构获取数据
      completed.push(Math.floor(stats.completionStats.totalCompleted / days));
      total.push(Math.floor(stats.instanceStats.totalInstances / days));
    }

    return { labels, completed, total };
  }

  /**
   * 获取完成率百分比
   */
  async getCompletionRate(
    accountUuid: string,
    startDate: number,
    endDate: number
  ): Promise<number> {
    const stats = await this.get({ accountUuid, startDate, endDate });
    return stats.completionStats.completionRate;
  }

  /**
   * 获取当前连胜天数（暂不支持，返回 0）
   */
  async getCurrentStreak(accountUuid: string): Promise<number> {
    // TaskStatisticsClientDTO 目前没有 streak 字段
    return 0;
  }
}

// ============ Singleton Export ============

export const taskStatisticsIPCClient = new TaskStatisticsIPCClient();
