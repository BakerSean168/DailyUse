/**
 * Schedule Desktop Application Service
 *
 * 包装 @dailyuse/application-server/schedule 的所有 Use Cases
 * 为 Desktop IPC handlers 提供统一的应用服务入口
 */

import {
  createScheduleTask,
  getScheduleTask,
  listScheduleTasks,
  pauseScheduleTask,
  resumeScheduleTask,
  deleteScheduleTask,
  findDueTasks,
  type CreateScheduleTaskInput,
  type ListScheduleTasksInput,
} from '@dailyuse/application-server';

import { ScheduleContainer } from '@dailyuse/infrastructure-server';
import type { ScheduleTaskClientDTO, ScheduleTaskStatus } from '@dailyuse/contracts/schedule';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ScheduleDesktopAppService');

export class ScheduleDesktopApplicationService {
  constructor() {
    // Container should be initialized by infrastructure module
  }

  // ===== Schedule Task =====

  async createTask(input: CreateScheduleTaskInput): Promise<ScheduleTaskClientDTO> {
    logger.debug('Creating schedule task', { name: input.name });
    const result = await createScheduleTask(input);
    return result.task;
  }

  async getTask(uuid: string): Promise<ScheduleTaskClientDTO | null> {
    const result = await getScheduleTask({ uuid });
    return result.task;
  }

  async listTasks(params: ListScheduleTasksInput = {}): Promise<{
    tasks: ScheduleTaskClientDTO[];
    total: number;
  }> {
    const result = await listScheduleTasks(params);
    return {
      tasks: result.tasks,
      total: result.total,
    };
  }

  async updateTask(
    uuid: string,
    updates: { description?: string; schedule?: { cronExpression?: string } },
  ): Promise<ScheduleTaskClientDTO> {
    const container = ScheduleContainer.getInstance();
    const repo = container.getScheduleTaskRepository();
    const task = await repo.findByUuid(uuid);
    if (!task) {
      throw new Error(`Schedule task not found: ${uuid}`);
    }

    // Update properties using domain methods
    // Note: name is immutable for ScheduleTask, only description and schedule can be updated
    if (updates.description !== undefined) {
      // ScheduleTask has updateDescription method inherited or in domain
    }
    if (updates.schedule?.cronExpression) {
      task.updateCronExpression(updates.schedule.cronExpression);
    }

    await repo.save(task);
    return task.toClientDTO();
  }

  async deleteTask(uuid: string): Promise<void> {
    await deleteScheduleTask({ uuid });
  }

  async pauseTask(uuid: string): Promise<{ success: boolean }> {
    const result = await pauseScheduleTask({ uuid });
    return { success: result.success };
  }

  async resumeTask(uuid: string): Promise<{ success: boolean }> {
    const result = await resumeScheduleTask({ uuid });
    return { success: result.success };
  }

  async listTasksBySourceEntity(
    sourceModule: string,
    sourceEntityId: string,
  ): Promise<{ tasks: ScheduleTaskClientDTO[]; total: number }> {
    // Use list with filter by source entity
    const result = await listScheduleTasks({
      sourceModule: sourceModule as any, // Cast to SourceModule enum
      sourceEntityId,
    });
    return {
      tasks: result.tasks,
      total: result.total,
    };
  }

  async listTasksByAccount(accountUuid: string): Promise<{
    tasks: ScheduleTaskClientDTO[];
    total: number;
  }> {
    const result = await listScheduleTasks({ accountUuid });
    return {
      tasks: result.tasks,
      total: result.total,
    };
  }

  async rescheduleTask(
    uuid: string,
    newSchedule: { cronExpression?: string },
  ): Promise<ScheduleTaskClientDTO> {
    const container = ScheduleContainer.getInstance();
    const repo = container.getScheduleTaskRepository();
    const task = await repo.findByUuid(uuid);
    if (!task) {
      throw new Error(`Schedule task not found: ${uuid}`);
    }
    if (newSchedule.cronExpression) {
      task.updateCronExpression(newSchedule.cronExpression);
    }
    await repo.save(task);
    return task.toClientDTO();
  }

  async batchReschedule(
    tasks: Array<{ uuid: string; cronExpression: string }>,
  ): Promise<{ success: boolean; count: number }> {
    let count = 0;
    for (const item of tasks) {
      try {
        await this.rescheduleTask(item.uuid, { cronExpression: item.cronExpression });
        count++;
      } catch (error) {
        logger.warn(`Failed to reschedule task ${item.uuid}`, error);
      }
    }
    return { success: true, count };
  }

  // ===== Due Tasks =====

  async findDueTasks(params?: { beforeTime?: Date }): Promise<{
    tasks: ScheduleTaskClientDTO[];
    total: number;
  }> {
    const result = await findDueTasks({
      beforeTime: params?.beforeTime || new Date(),
    });
    return {
      tasks: result.tasks,
      total: result.total,
    };
  }

  // ===== Statistics =====

  async getStatisticsSummary(accountUuid?: string): Promise<{
    total: number;
    active: number;
    completed: number;
    overdue: number;
  }> {
    const result = await listScheduleTasks({ accountUuid: accountUuid || 'default' });

    // Use ScheduleTaskStatus enum values
    const activeStatus: ScheduleTaskStatus = 'active' as ScheduleTaskStatus;
    const completedStatus: ScheduleTaskStatus = 'completed' as ScheduleTaskStatus;

    return {
      total: result.total,
      active: result.tasks.filter((t) => t.status === activeStatus).length,
      completed: result.tasks.filter((t) => t.status === completedStatus).length,
      overdue: result.tasks.filter((t) => t.isOverdue).length,
    };
  }

  async getStatisticsByDateRange(
    startDate: number,
    endDate: number,
    accountUuid?: string,
  ): Promise<{ data: Array<{ date: number; active: number; completed: number }> }> {
    const result = await listScheduleTasks({ accountUuid: accountUuid || 'default' });

    // Filter tasks by nextRunAt from execution info
    // nextRunAt is ISO string or null, need to convert to timestamp
    const startMs = startDate;
    const endMs = endDate;
    const filteredTasks = result.tasks.filter((task) => {
      const nextRunAtStr = task.execution?.nextRunAt;
      if (!nextRunAtStr) return false;
      const nextRunAt = new Date(nextRunAtStr).getTime();
      return nextRunAt >= startMs && nextRunAt <= endMs;
    });

    // Group by date
    const dateMap = new Map<number, { active: number; completed: number }>();
    for (const task of filteredTasks) {
      const nextRunAtStr = task.execution?.nextRunAt;
      if (!nextRunAtStr) continue;
      const nextRunAt = new Date(nextRunAtStr).getTime();
      const dateKey = new Date(nextRunAt).setHours(0, 0, 0, 0);
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { active: 0, completed: 0 });
      }
      const stats = dateMap.get(dateKey)!;
      stats.active++;
      if (task.status === ('completed' as ScheduleTaskStatus)) {
        stats.completed++;
      }
    }

    const data = Array.from(dateMap.entries()).map(([date, stats]) => ({
      date,
      active: stats.active,
      completed: stats.completed,
    }));

    return { data };
  }

  async getUpcoming(days: number = 7, accountUuid?: string): Promise<{
    tasks: ScheduleTaskClientDTO[];
    total: number;
  }> {
    const result = await listScheduleTasks({ accountUuid: accountUuid || 'default' });
    const now = Date.now();
    const endDate = now + days * 24 * 60 * 60 * 1000;

    // Filter tasks by nextRunAt within the date range and active status
    // nextRunAt is ISO string or null, need to convert to timestamp
    const upcomingTasks = result.tasks.filter((task) => {
      const nextRunAtStr = task.execution?.nextRunAt;
      if (!nextRunAtStr) return false;
      const nextRunAt = new Date(nextRunAtStr).getTime();
      return (
        nextRunAt >= now &&
        nextRunAt <= endDate &&
        task.status === ('active' as ScheduleTaskStatus)
      );
    });

    return {
      tasks: upcomingTasks,
      total: upcomingTasks.length,
    };
  }
}
