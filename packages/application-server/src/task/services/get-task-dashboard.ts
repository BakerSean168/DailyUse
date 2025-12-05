/**
 * Get Task Dashboard Service
 *
 * 获取任务仪表板数据
 */

import type { ITaskTemplateRepository, TaskFilters } from '@dailyuse/domain-server/task';
import type { TaskTemplateClientDTO } from '@dailyuse/contracts/task';
import { TaskType } from '@dailyuse/contracts/task';
import { TaskContainer } from '@dailyuse/infrastructure-server';

/**
 * Service Input
 */
export interface GetTaskDashboardInput {
  accountUuid: string;
}

/**
 * Dashboard statistics
 */
export interface TaskDashboardStatistics {
  totalActive: number;
  totalCompleted: number;
  totalOverdue: number;
  totalBlocked: number;
  completionRate: number;
}

/**
 * Service Output
 */
export interface GetTaskDashboardOutput {
  todayTasks: TaskTemplateClientDTO[];
  overdueTasks: TaskTemplateClientDTO[];
  blockedTasks: TaskTemplateClientDTO[];
  upcomingTasks: TaskTemplateClientDTO[];
  highPriorityTasks: TaskTemplateClientDTO[];
  recentCompleted: TaskTemplateClientDTO[];
  statistics: TaskDashboardStatistics;
}

/**
 * Get Task Dashboard Service
 */
export class GetTaskDashboard {
  private static instance: GetTaskDashboard;

  private constructor(private readonly templateRepository: ITaskTemplateRepository) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(templateRepository?: ITaskTemplateRepository): GetTaskDashboard {
    const container = TaskContainer.getInstance();
    const repo = templateRepository || container.getTemplateRepository();
    GetTaskDashboard.instance = new GetTaskDashboard(repo);
    return GetTaskDashboard.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetTaskDashboard {
    if (!GetTaskDashboard.instance) {
      GetTaskDashboard.instance = GetTaskDashboard.createInstance();
    }
    return GetTaskDashboard.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetTaskDashboard.instance = undefined as unknown as GetTaskDashboard;
  }

  async execute(input: GetTaskDashboardInput): Promise<GetTaskDashboardOutput> {
    const { accountUuid } = input;

    // 并行查询所有数据
    const [
      today,
      overdue,
      blocked,
      upcoming,
      highPriority,
      recentCompleted,
      totalActive,
      totalCompleted,
    ] = await Promise.all([
      this.getTodayTasks(accountUuid),
      this.getOverdueTasks(accountUuid),
      this.getBlockedTasks(accountUuid),
      this.getUpcomingTasks(accountUuid, 7),
      this.getHighPriorityTasks(accountUuid, 5),
      this.getRecentCompletedTasks(accountUuid, 10),
      this.countTasks(accountUuid, { taskType: TaskType.ONE_TIME, status: 'TODO' as any }),
      this.countTasks(accountUuid, { taskType: TaskType.ONE_TIME, status: 'COMPLETED' as any }),
    ]);

    const completionRate =
      totalActive + totalCompleted > 0
        ? Math.round((totalCompleted / (totalActive + totalCompleted)) * 100)
        : 0;

    return {
      todayTasks: today,
      overdueTasks: overdue,
      blockedTasks: blocked,
      upcomingTasks: upcoming,
      highPriorityTasks: highPriority,
      recentCompleted,
      statistics: {
        totalActive,
        totalCompleted,
        totalOverdue: overdue.length,
        totalBlocked: blocked.length,
        completionRate,
      },
    };
  }

  private async getTodayTasks(accountUuid: string): Promise<TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findTodayTasks(accountUuid);
    return tasks.map((t) => t.toClientDTO());
  }

  private async getOverdueTasks(accountUuid: string): Promise<TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findOverdueTasks(accountUuid);
    return tasks.map((t) => t.toClientDTO());
  }

  private async getBlockedTasks(accountUuid: string): Promise<TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findBlockedTasks(accountUuid);
    return tasks.map((t) => t.toClientDTO());
  }

  private async getUpcomingTasks(accountUuid: string, daysAhead: number): Promise<TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findUpcomingTasks(accountUuid, daysAhead);
    return tasks.map((t) => t.toClientDTO());
  }

  private async getHighPriorityTasks(accountUuid: string, limit: number): Promise<TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findTasksSortedByPriority(accountUuid, limit);
    return tasks.map((t) => t.toClientDTO());
  }

  private async getRecentCompletedTasks(accountUuid: string, limit: number): Promise<TaskTemplateClientDTO[]> {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const tasks = await this.templateRepository.findOneTimeTasks(accountUuid, {
      taskType: TaskType.ONE_TIME,
      status: 'COMPLETED' as any,
    });

    return tasks
      .filter((t) => t.updatedAt && t.updatedAt >= sevenDaysAgo)
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .slice(0, limit)
      .map((t) => t.toClientDTO());
  }

  private async countTasks(accountUuid: string, filters?: TaskFilters): Promise<number> {
    return await this.templateRepository.countTasks(accountUuid, filters);
  }
}

/**
 * 便捷函数：获取任务仪表板
 */
export const getTaskDashboard = (input: GetTaskDashboardInput): Promise<GetTaskDashboardOutput> =>
  GetTaskDashboard.getInstance().execute(input);
