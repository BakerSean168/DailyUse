/**
 * Task Desktop Application Service
 *
 * 包装 @dailyuse/application-server/task 的所有 Use Cases
 * 为 Desktop IPC handlers 提供统一的应用服务入口
 */

import {
  // Task Template Use Cases
  createTaskTemplate,
  getTaskTemplate,
  listTaskTemplates,
  activateTaskTemplate,
  pauseTaskTemplate,
  deleteTaskTemplate,
  createOneTimeTask,
  // Task Instance Use Cases
  completeTaskInstance,
  skipTaskInstance,
  getTaskInstancesByDateRange,
  // Dashboard
  getTaskDashboard,
  // Types
  type CreateTaskTemplateInput,
  type ListTaskTemplatesInput,
  type CreateOneTimeTaskInput,
  type GetTaskDashboardOutput,
} from '@dailyuse/application-server';

import { TaskContainer } from '@dailyuse/infrastructure-server';
import type {
  TaskTemplateClientDTO,
  TaskTemplateServerDTO,
  TaskInstanceClientDTO,
} from '@dailyuse/contracts/task';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('TaskDesktopAppService');

export class TaskDesktopApplicationService {
  constructor() {
    // Container should be initialized by infrastructure module
  }

  // ===== Task Template =====

  async createTemplate(input: CreateTaskTemplateInput): Promise<TaskTemplateServerDTO> {
    logger.debug('Creating task template', { title: input.title });
    const result = await createTaskTemplate(input);
    return result.template;
  }

  async createOneTimeTask(input: CreateOneTimeTaskInput): Promise<TaskTemplateServerDTO> {
    logger.debug('Creating one-time task', { title: input.title });
    const result = await createOneTimeTask(input);
    return result.template;
  }

  async getTemplate(uuid: string): Promise<TaskTemplateClientDTO | null> {
    const result = await getTaskTemplate({ uuid });
    return result.template;
  }

  async listTemplates(params: ListTaskTemplatesInput = {}): Promise<{
    templates: TaskTemplateClientDTO[];
    total: number;
  }> {
    const result = await listTaskTemplates(params);
    return {
      templates: result.templates,
      total: result.total,
    };
  }

  async updateTemplate(uuid: string, updates: Partial<CreateTaskTemplateInput>): Promise<TaskTemplateClientDTO> {
    const container = TaskContainer.getInstance();
    const repo = container.getTemplateRepository();
    const template = await repo.findById(uuid);
    if (!template) {
      throw new Error(`Task template not found: ${uuid}`);
    }

    // Update properties using domain methods
    if (updates.title) template.updateTitle(updates.title);
    if (updates.description !== undefined) template.updateDescription(updates.description ?? '');
    if (updates.importance) template.updatePriority(updates.importance, template.urgency);
    if (updates.urgency) template.updatePriority(template.importance, updates.urgency);
    if (updates.tags) template.updateTags(updates.tags);

    await repo.save(template);
    return template.toClientDTO();
  }

  async deleteTemplate(uuid: string): Promise<void> {
    await deleteTaskTemplate({ uuid });
  }

  async activateTemplate(uuid: string): Promise<TaskTemplateClientDTO> {
    const result = await activateTaskTemplate({ uuid });
    return result.template;
  }

  async pauseTemplate(uuid: string): Promise<TaskTemplateClientDTO> {
    const result = await pauseTaskTemplate({ uuid });
    return result.template;
  }

  async archiveTemplate(uuid: string): Promise<TaskTemplateClientDTO> {
    const container = TaskContainer.getInstance();
    const repo = container.getTemplateRepository();
    const template = await repo.findById(uuid);
    if (!template) {
      throw new Error(`Task template not found: ${uuid}`);
    }
    template.archive();
    await repo.save(template);
    return template.toClientDTO();
  }

  async restoreTemplate(uuid: string): Promise<TaskTemplateClientDTO> {
    const container = TaskContainer.getInstance();
    const repo = container.getTemplateRepository();
    const template = await repo.findById(uuid);
    if (!template) {
      throw new Error(`Task template not found: ${uuid}`);
    }
    template.restore();
    await repo.save(template);
    return template.toClientDTO();
  }

  async duplicateTemplate(uuid: string): Promise<TaskTemplateClientDTO> {
    const container = TaskContainer.getInstance();
    const repo = container.getTemplateRepository();
    const original = await repo.findById(uuid);
    if (!original) {
      throw new Error(`Task template not found: ${uuid}`);
    }
    const duplicate = original.duplicate();
    await repo.save(duplicate);
    return duplicate.toClientDTO();
  }

  async searchTemplates(query: string, limit?: number): Promise<{
    templates: TaskTemplateClientDTO[];
    total: number;
  }> {
    const container = TaskContainer.getInstance();
    const repo = container.getTemplateRepository();
    const templates = await repo.search(query, limit);
    return {
      templates: templates.map((t) => t.toClientDTO()),
      total: templates.length,
    };
  }

  async batchUpdateTemplates(
    updates: Array<{ uuid: string; changes: Partial<CreateTaskTemplateInput> }>,
  ): Promise<{ success: boolean; count: number }> {
    let count = 0;
    for (const update of updates) {
      try {
        await this.updateTemplate(update.uuid, update.changes);
        count++;
      } catch (error) {
        logger.warn(`Failed to update template ${update.uuid}`, error);
      }
    }
    return { success: true, count };
  }

  // ===== Task Instance =====

  async getInstance(uuid: string): Promise<TaskInstanceClientDTO | null> {
    const container = TaskContainer.getInstance();
    const repo = container.getInstanceRepository();
    const instance = await repo.findById(uuid);
    return instance?.toClientDTO() ?? null;
  }

  async listInstances(params: {
    templateUuid?: string;
    status?: string;
    accountUuid?: string;
  } = {}): Promise<{ instances: TaskInstanceClientDTO[]; total: number }> {
    const container = TaskContainer.getInstance();
    const repo = container.getInstanceRepository();
    const instances = await repo.findAll(params);
    return {
      instances: instances.map((i) => i.toClientDTO()),
      total: instances.length,
    };
  }

  async completeInstance(
    uuid: string,
    completion?: { actualDuration?: number; completedAt?: number },
  ): Promise<TaskInstanceClientDTO> {
    const result = await completeTaskInstance({
      uuid,
      actualDuration: completion?.actualDuration,
      completedAt: completion?.completedAt,
    });
    return result.instance;
  }

  async uncompleteInstance(uuid: string): Promise<TaskInstanceClientDTO> {
    const container = TaskContainer.getInstance();
    const repo = container.getInstanceRepository();
    const instance = await repo.findById(uuid);
    if (!instance) {
      throw new Error(`Task instance not found: ${uuid}`);
    }
    instance.uncomplete();
    await repo.save(instance);
    return instance.toClientDTO();
  }

  async skipInstance(uuid: string, reason?: string): Promise<TaskInstanceClientDTO> {
    const result = await skipTaskInstance({ uuid, reason });
    return result.instance;
  }

  async rescheduleInstance(uuid: string, newDate: number): Promise<TaskInstanceClientDTO> {
    const container = TaskContainer.getInstance();
    const repo = container.getInstanceRepository();
    const instance = await repo.findById(uuid);
    if (!instance) {
      throw new Error(`Task instance not found: ${uuid}`);
    }
    instance.reschedule(newDate);
    await repo.save(instance);
    return instance.toClientDTO();
  }

  async startInstance(uuid: string): Promise<TaskInstanceClientDTO> {
    const container = TaskContainer.getInstance();
    const repo = container.getInstanceRepository();
    const instance = await repo.findById(uuid);
    if (!instance) {
      throw new Error(`Task instance not found: ${uuid}`);
    }
    instance.start();
    await repo.save(instance);
    return instance.toClientDTO();
  }

  async pauseInstance(uuid: string): Promise<TaskInstanceClientDTO> {
    const container = TaskContainer.getInstance();
    const repo = container.getInstanceRepository();
    const instance = await repo.findById(uuid);
    if (!instance) {
      throw new Error(`Task instance not found: ${uuid}`);
    }
    instance.pause();
    await repo.save(instance);
    return instance.toClientDTO();
  }

  async logTime(uuid: string, duration: number, note?: string): Promise<TaskInstanceClientDTO> {
    const container = TaskContainer.getInstance();
    const repo = container.getInstanceRepository();
    const instance = await repo.findById(uuid);
    if (!instance) {
      throw new Error(`Task instance not found: ${uuid}`);
    }
    instance.logTime(duration, note);
    await repo.save(instance);
    return instance.toClientDTO();
  }

  async listInstancesByDate(date: number): Promise<{ instances: TaskInstanceClientDTO[]; total: number }> {
    const container = TaskContainer.getInstance();
    const repo = container.getInstanceRepository();
    const instances = await repo.findByDate(date);
    return {
      instances: instances.map((i) => i.toClientDTO()),
      total: instances.length,
    };
  }

  async listInstancesByDateRange(
    startDate: number,
    endDate: number,
  ): Promise<{ instances: TaskInstanceClientDTO[]; total: number }> {
    const result = await getTaskInstancesByDateRange({ startDate, endDate });
    return {
      instances: result.instances,
      total: result.total,
    };
  }

  async listInstancesByTemplate(templateUuid: string): Promise<{
    instances: TaskInstanceClientDTO[];
    total: number;
  }> {
    const container = TaskContainer.getInstance();
    const repo = container.getInstanceRepository();
    const instances = await repo.findByTemplateUuid(templateUuid);
    return {
      instances: instances.map((i) => i.toClientDTO()),
      total: instances.length,
    };
  }

  async batchCompleteInstances(uuids: string[]): Promise<{ success: boolean; count: number }> {
    let count = 0;
    for (const uuid of uuids) {
      try {
        await this.completeInstance(uuid);
        count++;
      } catch (error) {
        logger.warn(`Failed to complete instance ${uuid}`, error);
      }
    }
    return { success: true, count };
  }

  async deleteInstance(uuid: string): Promise<void> {
    const container = TaskContainer.getInstance();
    const repo = container.getInstanceRepository();
    await repo.delete(uuid);
  }

  async batchUpdateInstances(
    updates: Array<{ uuid: string; changes: Record<string, unknown> }>,
  ): Promise<{ success: boolean; count: number }> {
    // Placeholder - basic implementation
    return { success: true, count: 0 };
  }

  // ===== Task Dependency =====

  async createDependency(request: {
    fromTaskUuid: string;
    toTaskUuid: string;
    type: string;
  }): Promise<{ uuid: string; fromTaskUuid: string; toTaskUuid: string; type: string }> {
    // Placeholder - TaskDependency feature
    logger.info('createDependency placeholder', request);
    return {
      uuid: '',
      fromTaskUuid: request.fromTaskUuid,
      toTaskUuid: request.toTaskUuid,
      type: request.type,
    };
  }

  async listDependencies(taskUuid: string): Promise<{ dependencies: unknown[]; total: number }> {
    // Placeholder
    return { dependencies: [], total: 0 };
  }

  async deleteDependency(uuid: string): Promise<void> {
    // Placeholder
  }

  async getBlockedTasks(taskUuid: string): Promise<{ dependencies: unknown[] }> {
    // Placeholder
    return { dependencies: [] };
  }

  async getBlockingTasks(taskUuid: string): Promise<{ dependencies: unknown[] }> {
    // Placeholder
    return { dependencies: [] };
  }

  async checkCircularDependency(fromUuid: string, toUuid: string): Promise<{ hasCircular: boolean }> {
    // Placeholder
    return { hasCircular: false };
  }

  // ===== Statistics =====

  async getStatisticsSummary(accountUuid?: string): Promise<{
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  }> {
    const container = TaskContainer.getInstance();
    const statsRepo = container.getStatisticsRepository();
    return statsRepo.getSummary(accountUuid || 'default');
  }

  async getStatisticsByDateRange(
    startDate: number,
    endDate: number,
  ): Promise<{ data: Array<{ date: number; completed: number; created: number }> }> {
    const container = TaskContainer.getInstance();
    const statsRepo = container.getStatisticsRepository();
    return { data: await statsRepo.getByDateRange(startDate, endDate) };
  }

  async getStatisticsByTemplate(templateUuid: string): Promise<{
    completionRate: number;
    avgDuration: number;
  }> {
    const container = TaskContainer.getInstance();
    const statsRepo = container.getStatisticsRepository();
    return statsRepo.getByTemplate(templateUuid);
  }

  async getProductivity(date: number): Promise<{
    tasksCompleted: number;
    timeSpent: number;
    productivity: number;
  }> {
    const container = TaskContainer.getInstance();
    const statsRepo = container.getStatisticsRepository();
    return statsRepo.getProductivity(date);
  }

  async getTrends(days: number): Promise<{ data: Array<{ date: number; value: number }> }> {
    const container = TaskContainer.getInstance();
    const statsRepo = container.getStatisticsRepository();
    return { data: await statsRepo.getTrends(days) };
  }

  // ===== Dashboard =====

  async getDashboard(accountUuid: string): Promise<GetTaskDashboardOutput> {
    return getTaskDashboard({ accountUuid });
  }
}
