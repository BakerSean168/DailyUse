/**
 * Task Application Service - Renderer
 *
 * 任务应用服务 - 渲染进程
 *
 * 职责：
 * - 调用 @dailyuse/application-client 的 Task Use Cases
 * - 不包含业务逻辑
 */

import {
  // Template Use Cases
  listTaskTemplates,
  getTaskTemplate,
  createTaskTemplate,
  updateTaskTemplate,
  deleteTaskTemplate,
  activateTaskTemplate,
  pauseTaskTemplate,
  archiveTaskTemplate,
  // Instance Use Cases
  listTaskInstances,
  getTaskInstance,
  startTaskInstance,
  completeTaskInstance,
  skipTaskInstance,
  deleteTaskInstance,
  getInstancesByDateRange,
  // Statistics Use Cases
  getTaskStatistics,
  getTodayCompletionRate,
  getWeekCompletionRate,
  getEfficiencyTrend,
  // Dependency Use Cases
  getTaskDependencies,
  getTaskDependents,
  createTaskDependency,
  deleteTaskDependency,
  getDependencyChain,
  // Types
  type CreateTaskTemplateInput,
  type GetInstancesByDateRangeInput,
  type CreateTaskDependencyInput,
  type GetTaskStatisticsInput,
  type DeleteTaskDependencyInput,
} from '@dailyuse/application-client';
import type {
  TaskTemplateClientDTO,
  TaskInstanceClientDTO,
  UpdateTaskTemplateRequest,
} from '@dailyuse/contracts/task';

/**
 * Task Application Service
 */
export class TaskApplicationService {
  private static instance: TaskApplicationService;

  private constructor() {}

  static getInstance(): TaskApplicationService {
    if (!TaskApplicationService.instance) {
      TaskApplicationService.instance = new TaskApplicationService();
    }
    return TaskApplicationService.instance;
  }

  // ===== Template Operations =====

  async listTemplates(): Promise<TaskTemplateClientDTO[]> {
    return listTaskTemplates();
  }

  async getTemplate(templateId: string): Promise<TaskTemplateClientDTO | null> {
    try {
      return await getTaskTemplate(templateId);
    } catch {
      return null;
    }
  }

  async createTemplate(input: CreateTaskTemplateInput): Promise<TaskTemplateClientDTO> {
    return createTaskTemplate(input);
  }

  async updateTemplate(uuid: string, request: UpdateTaskTemplateRequest) {
    return updateTaskTemplate(uuid, request);
  }

  async deleteTemplate(templateId: string): Promise<void> {
    return deleteTaskTemplate(templateId);
  }

  async activateTemplate(templateId: string) {
    return activateTaskTemplate(templateId);
  }

  async pauseTemplate(templateId: string): Promise<TaskTemplateClientDTO> {
    return pauseTaskTemplate(templateId);
  }

  async archiveTemplate(templateId: string): Promise<TaskTemplateClientDTO> {
    return archiveTaskTemplate(templateId);
  }

  // ===== Instance Operations =====

  async listInstances(): Promise<TaskInstanceClientDTO[]> {
    return listTaskInstances();
  }

  async getInstance(instanceId: string): Promise<TaskInstanceClientDTO | null> {
    try {
      return await getTaskInstance(instanceId);
    } catch {
      return null;
    }
  }

  async startInstance(instanceId: string): Promise<TaskInstanceClientDTO> {
    return startTaskInstance(instanceId);
  }

  async completeInstance(instanceId: string) {
    return completeTaskInstance(instanceId);
  }

  async skipInstance(instanceId: string) {
    return skipTaskInstance(instanceId);
  }

  async deleteInstance(instanceId: string): Promise<void> {
    return deleteTaskInstance(instanceId);
  }

  async getInstancesByDateRange(input: GetInstancesByDateRangeInput): Promise<TaskInstanceClientDTO[]> {
    return getInstancesByDateRange(input);
  }

  // ===== Statistics =====

  async getStatistics(input: GetTaskStatisticsInput) {
    try {
      return await getTaskStatistics(input);
    } catch {
      return null;
    }
  }

  async getTodayCompletionRate(accountUuid: string) {
    return getTodayCompletionRate(accountUuid);
  }

  async getWeekCompletionRate(accountUuid: string) {
    return getWeekCompletionRate(accountUuid);
  }

  async getEfficiencyTrend(accountUuid: string) {
    return getEfficiencyTrend(accountUuid);
  }

  // ===== Dependencies =====

  async getDependencies(templateId: string) {
    return getTaskDependencies(templateId);
  }

  async getDependents(templateId: string) {
    return getTaskDependents(templateId);
  }

  async createDependency(input: CreateTaskDependencyInput) {
    return createTaskDependency(input);
  }

  async deleteDependency(input: DeleteTaskDependencyInput) {
    return deleteTaskDependency(input);
  }

  async getDependencyChain(templateId: string) {
    return getDependencyChain(templateId);
  }
}

// 导出单例实例
export const taskApplicationService = TaskApplicationService.getInstance();
