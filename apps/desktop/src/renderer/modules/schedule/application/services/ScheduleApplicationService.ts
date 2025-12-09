/**
 * Schedule Application Service - Renderer
 *
 * 日程应用服务 - 渲染进程
 */

import {
  // Schedule Task Use Cases
  listScheduleTasks,
  getScheduleTask,
  createScheduleTask,
  pauseScheduleTask,
  resumeScheduleTask,
  completeScheduleTask,
  cancelScheduleTask,
  deleteScheduleTask,
  deleteScheduleTasksBatch,
  createScheduleTasksBatch,
  getDueTasks,
  getTaskBySource,
  updateTaskMetadata,
  getScheduleStatistics,
  getModuleStatistics,
  getAllModuleStatistics,
  recalculateStatistics,
  resetStatistics,
  deleteStatistics,
  // Schedule Event Use Cases
  createScheduleEvent,
  getScheduleEvent,
  listSchedulesByAccount,
  getSchedulesByTimeRange,
  // Types
  type CreateScheduleTaskInput,
  type CreateScheduleTasksBatchInput,
  type GetDueTasksInput,
  type GetTaskBySourceInput,
  type CompleteScheduleTaskInput,
  type CancelScheduleTaskInput,
  type UpdateTaskMetadataInput,
  type CreateScheduleEventInput,
  type GetSchedulesByTimeRangeInput,
} from '@dailyuse/application-client';
import type {
  ScheduleTaskClientDTO,
  ScheduleClientDTO,
  SourceModule,
} from '@dailyuse/contracts/schedule';

/**
 * Schedule Application Service
 */
export class ScheduleApplicationService {
  private static instance: ScheduleApplicationService;

  private constructor() {}

  static getInstance(): ScheduleApplicationService {
    if (!ScheduleApplicationService.instance) {
      ScheduleApplicationService.instance = new ScheduleApplicationService();
    }
    return ScheduleApplicationService.instance;
  }

  // ===== Schedule Task Operations =====

  async listScheduleTasks(): Promise<ScheduleTaskClientDTO[]> {
    return listScheduleTasks();
  }

  async getScheduleTask(taskId: string): Promise<ScheduleTaskClientDTO | null> {
    try {
      return await getScheduleTask(taskId);
    } catch {
      return null;
    }
  }

  async createScheduleTask(input: CreateScheduleTaskInput): Promise<ScheduleTaskClientDTO> {
    return createScheduleTask(input);
  }

  async createScheduleTasksBatch(input: CreateScheduleTasksBatchInput): Promise<ScheduleTaskClientDTO[]> {
    return createScheduleTasksBatch(input);
  }

  async pauseScheduleTask(taskId: string): Promise<void> {
    return pauseScheduleTask(taskId);
  }

  async resumeScheduleTask(taskId: string): Promise<void> {
    return resumeScheduleTask(taskId);
  }

  async completeScheduleTask(input: CompleteScheduleTaskInput): Promise<void> {
    return completeScheduleTask(input);
  }

  async cancelScheduleTask(input: CancelScheduleTaskInput): Promise<void> {
    return cancelScheduleTask(input);
  }

  async deleteScheduleTask(taskId: string): Promise<void> {
    return deleteScheduleTask(taskId);
  }

  async deleteScheduleTasksBatch(taskIds: string[]): Promise<void> {
    return deleteScheduleTasksBatch(taskIds);
  }

  async getDueTasks(input: GetDueTasksInput): Promise<ScheduleTaskClientDTO[]> {
    return getDueTasks(input);
  }

  async getTaskBySource(input: GetTaskBySourceInput): Promise<ScheduleTaskClientDTO[]> {
    return getTaskBySource(input);
  }

  async updateTaskMetadata(input: UpdateTaskMetadataInput): Promise<void> {
    return updateTaskMetadata(input);
  }

  // ===== Statistics Operations =====

  async getScheduleStatistics() {
    return getScheduleStatistics();
  }

  async getModuleStatistics(module: SourceModule) {
    return getModuleStatistics(module);
  }

  async getAllModuleStatistics() {
    return getAllModuleStatistics();
  }

  async recalculateStatistics() {
    return recalculateStatistics();
  }

  async resetStatistics(): Promise<void> {
    return resetStatistics();
  }

  async deleteStatistics(): Promise<void> {
    return deleteStatistics();
  }

  // ===== Schedule Event Operations =====

  async createScheduleEvent(input: CreateScheduleEventInput): Promise<ScheduleClientDTO> {
    return createScheduleEvent(input);
  }

  async getScheduleEvent(eventId: string): Promise<ScheduleClientDTO | null> {
    try {
      return await getScheduleEvent(eventId);
    } catch {
      return null;
    }
  }

  async listSchedulesByAccount(): Promise<ScheduleClientDTO[]> {
    return listSchedulesByAccount();
  }

  async getSchedulesByTimeRange(input: GetSchedulesByTimeRangeInput): Promise<ScheduleClientDTO[]> {
    return getSchedulesByTimeRange(input);
  }
}

// Singleton instance
export const scheduleApplicationService = ScheduleApplicationService.getInstance();
