# STORY-003: Task 模块完整实现

> **EPIC**: EPIC-010 Desktop 全面 DDD 模块化重构  
> **Sprint**: Sprint 1  
> **预估**: 16 小时  
> **优先级**: P0  
> **依赖**: STORY-001

---

## 📋 概述

Task 模块当前全部是 TODO 占位符（36+ IPC channels），需要完整实现：
- TaskTemplate CRUD (10 channels)
- TaskInstance CRUD (15 channels)
- TaskDependency CRUD (6 channels)
- TaskStatistics (5 channels)

这是最复杂的模块，将作为其他模块的参考模板。

---

## 🎯 目标

1. 完整实现 Task 模块所有 IPC handlers
2. 复用 `@dailyuse/application-server/task` 的所有 Use Cases
3. 建立可复用的模块实现模式

---

## ✅ 验收标准 (AC)

### AC-1: TaskTemplate CRUD
```gherkin
Given TaskTemplate IPC channels
When 调用以下 channels:
  - task-template:create
  - task-template:list
  - task-template:get
  - task-template:update
  - task-template:delete
  - task-template:archive
  - task-template:restore
  - task-template:duplicate
  - task-template:search
  - task-template:batch-update
Then 每个 channel 应返回真实数据
And 数据应持久化到 SQLite
```

### AC-2: TaskInstance CRUD
```gherkin
Given TaskInstance IPC channels
When 调用以下 channels:
  - task-instance:create
  - task-instance:list
  - task-instance:get
  - task-instance:update
  - task-instance:delete
  - task-instance:complete
  - task-instance:uncomplete
  - task-instance:reschedule
  - task-instance:skip
  - task-instance:start
  - task-instance:pause
  - task-instance:log-time
  - task-instance:list-by-date
  - task-instance:list-by-range
  - task-instance:list-by-template
  - task-instance:batch-update
  - task-instance:batch-complete
Then 每个 channel 应返回真实数据
```

### AC-3: TaskDependency
```gherkin
Given TaskDependency IPC channels
When 调用以下 channels:
  - task-dependency:create
  - task-dependency:list
  - task-dependency:delete
  - task-dependency:get-blocked
  - task-dependency:get-blocking
  - task-dependency:check-circular
Then 应正确处理任务依赖关系
```

### AC-4: TaskStatistics
```gherkin
Given TaskStatistics IPC channels
When 调用以下 channels:
  - task-statistics:get-summary
  - task-statistics:get-by-date-range
  - task-statistics:get-by-template
  - task-statistics:get-productivity
  - task-statistics:get-trends
Then 应返回正确的统计数据
```

---

## 📁 任务清单

### Task 3.1: 创建 TaskDesktopApplicationService

**文件**: `apps/desktop/src/main/modules/task/application/TaskDesktopApplicationService.ts`

```typescript
/**
 * Task Desktop Application Service
 * 
 * 包装 @dailyuse/application-server/task 的所有 Use Cases
 */

import {
  // Task Template Use Cases
  CreateTaskTemplate,
  createTaskTemplate,
  GetTaskTemplate,
  getTaskTemplate,
  ListTaskTemplates,
  listTaskTemplates,
  ActivateTaskTemplate,
  activateTaskTemplate,
  PauseTaskTemplate,
  pauseTaskTemplate,
  DeleteTaskTemplate,
  deleteTaskTemplate,
  // Task Instance Use Cases
  CompleteTaskInstance,
  completeTaskInstance,
  SkipTaskInstance,
  skipTaskInstance,
  GetTaskInstancesByDateRange,
  getTaskInstancesByDateRange,
  // Dashboard
  GetTaskDashboard,
  getTaskDashboard,
  // Types
  type CreateTaskTemplateInput,
  type ListTaskTemplatesInput,
  type GetTaskDashboardOutput,
} from '@dailyuse/application-server';

import { TaskContainer } from '@dailyuse/infrastructure-server';
import type {
  TaskTemplateClientDTO,
  TaskInstanceClientDTO,
  TaskDependencyClientDTO,
  CreateTaskTemplateRequest,
  UpdateTaskTemplateRequest,
  CreateTaskInstanceRequest,
} from '@dailyuse/contracts/task';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('TaskDesktopAppService');

export class TaskDesktopApplicationService {
  private container: typeof TaskContainer.prototype;

  constructor() {
    this.container = TaskContainer.getInstance();
  }

  // ===== Task Template =====

  async createTemplate(request: CreateTaskTemplateRequest): Promise<TaskTemplateClientDTO> {
    logger.debug('Creating task template', { title: request.title });
    const input: CreateTaskTemplateInput = {
      accountUuid: request.accountUuid || 'default',
      title: request.title,
      description: request.description,
      type: request.type,
      importance: request.importance,
      urgency: request.urgency,
      estimatedDuration: request.estimatedDuration,
      tags: request.tags,
    };
    const result = await createTaskTemplate(
      this.container.getTemplateRepository(),
      input
    );
    return result.template;
  }

  async getTemplate(uuid: string): Promise<TaskTemplateClientDTO | null> {
    const result = await getTaskTemplate(
      this.container.getTemplateRepository(),
      { uuid }
    );
    return result.template;
  }

  async listTemplates(params: ListTaskTemplatesInput = {}): Promise<{
    templates: TaskTemplateClientDTO[];
    total: number;
  }> {
    const result = await listTaskTemplates(
      this.container.getTemplateRepository(),
      params
    );
    return {
      templates: result.templates,
      total: result.total,
    };
  }

  async updateTemplate(uuid: string, request: UpdateTaskTemplateRequest): Promise<TaskTemplateClientDTO> {
    const repo = this.container.getTemplateRepository();
    const template = await repo.findById(uuid);
    if (!template) {
      throw new Error(`Task template not found: ${uuid}`);
    }
    // 更新模板属性
    if (request.title) template.updateTitle(request.title);
    if (request.description !== undefined) template.updateDescription(request.description);
    // ... 其他属性更新
    await repo.save(template);
    return template.toClientDTO();
  }

  async deleteTemplate(uuid: string): Promise<void> {
    await deleteTaskTemplate(
      this.container.getTemplateRepository(),
      { uuid }
    );
  }

  async archiveTemplate(uuid: string): Promise<TaskTemplateClientDTO> {
    const repo = this.container.getTemplateRepository();
    const template = await repo.findById(uuid);
    if (!template) {
      throw new Error(`Task template not found: ${uuid}`);
    }
    template.archive();
    await repo.save(template);
    return template.toClientDTO();
  }

  async restoreTemplate(uuid: string): Promise<TaskTemplateClientDTO> {
    const repo = this.container.getTemplateRepository();
    const template = await repo.findById(uuid);
    if (!template) {
      throw new Error(`Task template not found: ${uuid}`);
    }
    template.restore();
    await repo.save(template);
    return template.toClientDTO();
  }

  async duplicateTemplate(uuid: string): Promise<TaskTemplateClientDTO> {
    const repo = this.container.getTemplateRepository();
    const original = await repo.findById(uuid);
    if (!original) {
      throw new Error(`Task template not found: ${uuid}`);
    }
    const duplicate = original.duplicate();
    await repo.save(duplicate);
    return duplicate.toClientDTO();
  }

  async searchTemplates(query: string, params?: { limit?: number }): Promise<{
    templates: TaskTemplateClientDTO[];
    total: number;
  }> {
    const repo = this.container.getTemplateRepository();
    const templates = await repo.search(query, params?.limit);
    return {
      templates: templates.map(t => t.toClientDTO()),
      total: templates.length,
    };
  }

  async batchUpdateTemplates(updates: Array<{ uuid: string; changes: Partial<UpdateTaskTemplateRequest> }>): Promise<{
    success: boolean;
    count: number;
  }> {
    const repo = this.container.getTemplateRepository();
    let count = 0;
    for (const update of updates) {
      try {
        await this.updateTemplate(update.uuid, update.changes as UpdateTaskTemplateRequest);
        count++;
      } catch (error) {
        logger.warn(`Failed to update template ${update.uuid}`, error);
      }
    }
    return { success: true, count };
  }

  // ===== Task Instance =====

  async createInstance(request: CreateTaskInstanceRequest): Promise<TaskInstanceClientDTO> {
    const repo = this.container.getInstanceRepository();
    const { TaskInstance } = await import('@dailyuse/domain-server/task');
    const instance = TaskInstance.create(request);
    await repo.save(instance);
    return instance.toClientDTO();
  }

  async getInstance(uuid: string): Promise<TaskInstanceClientDTO | null> {
    const repo = this.container.getInstanceRepository();
    const instance = await repo.findById(uuid);
    return instance?.toClientDTO() ?? null;
  }

  async listInstances(params: {
    templateUuid?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ instances: TaskInstanceClientDTO[]; total: number }> {
    const repo = this.container.getInstanceRepository();
    const instances = await repo.findAll(params);
    return {
      instances: instances.map(i => i.toClientDTO()),
      total: instances.length,
    };
  }

  async completeInstance(uuid: string, completion?: {
    actualDuration?: number;
    completedAt?: number;
    notes?: string;
  }): Promise<TaskInstanceClientDTO> {
    const result = await completeTaskInstance(
      this.container.getInstanceRepository(),
      this.container.getStatisticsRepository(),
      {
        uuid,
        actualDuration: completion?.actualDuration,
        completedAt: completion?.completedAt,
      }
    );
    return result.instance;
  }

  async uncompleteInstance(uuid: string): Promise<TaskInstanceClientDTO> {
    const repo = this.container.getInstanceRepository();
    const instance = await repo.findById(uuid);
    if (!instance) {
      throw new Error(`Task instance not found: ${uuid}`);
    }
    instance.uncomplete();
    await repo.save(instance);
    return instance.toClientDTO();
  }

  async skipInstance(uuid: string, reason?: string): Promise<TaskInstanceClientDTO> {
    const result = await skipTaskInstance(
      this.container.getInstanceRepository(),
      { uuid, reason }
    );
    return result.instance;
  }

  async rescheduleInstance(uuid: string, newDate: number): Promise<TaskInstanceClientDTO> {
    const repo = this.container.getInstanceRepository();
    const instance = await repo.findById(uuid);
    if (!instance) {
      throw new Error(`Task instance not found: ${uuid}`);
    }
    instance.reschedule(newDate);
    await repo.save(instance);
    return instance.toClientDTO();
  }

  async startInstance(uuid: string): Promise<TaskInstanceClientDTO> {
    const repo = this.container.getInstanceRepository();
    const instance = await repo.findById(uuid);
    if (!instance) {
      throw new Error(`Task instance not found: ${uuid}`);
    }
    instance.start();
    await repo.save(instance);
    return instance.toClientDTO();
  }

  async pauseInstance(uuid: string): Promise<TaskInstanceClientDTO> {
    const repo = this.container.getInstanceRepository();
    const instance = await repo.findById(uuid);
    if (!instance) {
      throw new Error(`Task instance not found: ${uuid}`);
    }
    instance.pause();
    await repo.save(instance);
    return instance.toClientDTO();
  }

  async logTime(uuid: string, duration: number, note?: string): Promise<TaskInstanceClientDTO> {
    const repo = this.container.getInstanceRepository();
    const instance = await repo.findById(uuid);
    if (!instance) {
      throw new Error(`Task instance not found: ${uuid}`);
    }
    instance.logTime(duration, note);
    await repo.save(instance);
    return instance.toClientDTO();
  }

  async listInstancesByDate(date: number): Promise<{ instances: TaskInstanceClientDTO[]; total: number }> {
    const repo = this.container.getInstanceRepository();
    const instances = await repo.findByDate(date);
    return {
      instances: instances.map(i => i.toClientDTO()),
      total: instances.length,
    };
  }

  async listInstancesByDateRange(startDate: number, endDate: number): Promise<{
    instances: TaskInstanceClientDTO[];
    total: number;
  }> {
    const result = await getTaskInstancesByDateRange(
      this.container.getInstanceRepository(),
      { startDate, endDate }
    );
    return {
      instances: result.instances,
      total: result.total,
    };
  }

  async listInstancesByTemplate(templateUuid: string): Promise<{
    instances: TaskInstanceClientDTO[];
    total: number;
  }> {
    const repo = this.container.getInstanceRepository();
    const instances = await repo.findByTemplateUuid(templateUuid);
    return {
      instances: instances.map(i => i.toClientDTO()),
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

  // ===== Task Dependency =====

  async createDependency(request: {
    fromTaskUuid: string;
    toTaskUuid: string;
    type: string;
  }): Promise<TaskDependencyClientDTO> {
    const { TaskDependencyService } = await import('@dailyuse/domain-server/task');
    const depService = new TaskDependencyService(
      this.container.getDependencyRepository?.() as any
    );
    // TODO: 实现依赖创建
    throw new Error('Not implemented - need TaskDependencyRepository');
  }

  async listDependencies(taskUuid: string): Promise<{
    dependencies: TaskDependencyClientDTO[];
    total: number;
  }> {
    // TODO: 实现
    return { dependencies: [], total: 0 };
  }

  async deleteDependency(uuid: string): Promise<void> {
    // TODO: 实现
  }

  async getBlockedTasks(taskUuid: string): Promise<{ dependencies: TaskDependencyClientDTO[] }> {
    // TODO: 实现
    return { dependencies: [] };
  }

  async getBlockingTasks(taskUuid: string): Promise<{ dependencies: TaskDependencyClientDTO[] }> {
    // TODO: 实现
    return { dependencies: [] };
  }

  async checkCircularDependency(fromUuid: string, toUuid: string): Promise<{ hasCircular: boolean }> {
    // TODO: 实现
    return { hasCircular: false };
  }

  // ===== Statistics =====

  async getStatisticsSummary(params?: { accountUuid?: string }): Promise<{
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  }> {
    const statsRepo = this.container.getStatisticsRepository();
    return statsRepo.getSummary(params?.accountUuid || 'default');
  }

  async getStatisticsByDateRange(startDate: number, endDate: number): Promise<{
    data: Array<{ date: number; completed: number; created: number }>;
  }> {
    const statsRepo = this.container.getStatisticsRepository();
    return { data: await statsRepo.getByDateRange(startDate, endDate) };
  }

  async getStatisticsByTemplate(templateUuid: string): Promise<{
    completionRate: number;
    avgDuration: number;
  }> {
    const statsRepo = this.container.getStatisticsRepository();
    return statsRepo.getByTemplate(templateUuid);
  }

  async getProductivity(date: number): Promise<{
    tasksCompleted: number;
    timeSpent: number;
    productivity: number;
  }> {
    const statsRepo = this.container.getStatisticsRepository();
    return statsRepo.getProductivity(date);
  }

  async getTrends(days: number): Promise<{
    data: Array<{ date: number; value: number }>;
  }> {
    const statsRepo = this.container.getStatisticsRepository();
    return { data: await statsRepo.getTrends(days) };
  }

  // ===== Dashboard =====

  async getDashboard(accountUuid: string): Promise<GetTaskDashboardOutput> {
    return getTaskDashboard(
      this.container.getTemplateRepository(),
      this.container.getInstanceRepository(),
      this.container.getStatisticsRepository(),
      { accountUuid }
    );
  }
}
```

### Task 3.2: 创建 TaskTemplate IPC Handlers

**文件**: `apps/desktop/src/main/modules/task/ipc/task-template.ipc-handlers.ts`

```typescript
/**
 * Task Template IPC Handlers
 */

import { ipcMain } from 'electron';
import { TaskDesktopApplicationService } from '../application/TaskDesktopApplicationService';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('TaskTemplateIPC');

let appService: TaskDesktopApplicationService | null = null;

function getAppService(): TaskDesktopApplicationService {
  if (!appService) {
    appService = new TaskDesktopApplicationService();
  }
  return appService;
}

export function registerTaskTemplateIpcHandlers(): void {
  ipcMain.handle('task-template:create', async (_, request) => {
    try {
      return await getAppService().createTemplate(request);
    } catch (error) {
      logger.error('Failed to create task template', error);
      throw error;
    }
  });

  ipcMain.handle('task-template:list', async (_, params) => {
    try {
      const result = await getAppService().listTemplates(params);
      return result.templates; // 返回数组以兼容现有接口
    } catch (error) {
      logger.error('Failed to list task templates', error);
      throw error;
    }
  });

  ipcMain.handle('task-template:get', async (_, uuid) => {
    try {
      return await getAppService().getTemplate(uuid);
    } catch (error) {
      logger.error('Failed to get task template', error);
      throw error;
    }
  });

  ipcMain.handle('task-template:update', async (_, uuid, request) => {
    try {
      return await getAppService().updateTemplate(uuid, request);
    } catch (error) {
      logger.error('Failed to update task template', error);
      throw error;
    }
  });

  ipcMain.handle('task-template:delete', async (_, uuid) => {
    try {
      await getAppService().deleteTemplate(uuid);
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete task template', error);
      throw error;
    }
  });

  ipcMain.handle('task-template:archive', async (_, uuid) => {
    try {
      return await getAppService().archiveTemplate(uuid);
    } catch (error) {
      logger.error('Failed to archive task template', error);
      throw error;
    }
  });

  ipcMain.handle('task-template:restore', async (_, uuid) => {
    try {
      return await getAppService().restoreTemplate(uuid);
    } catch (error) {
      logger.error('Failed to restore task template', error);
      throw error;
    }
  });

  ipcMain.handle('task-template:duplicate', async (_, uuid) => {
    try {
      return await getAppService().duplicateTemplate(uuid);
    } catch (error) {
      logger.error('Failed to duplicate task template', error);
      throw error;
    }
  });

  ipcMain.handle('task-template:search', async (_, query, params) => {
    try {
      return await getAppService().searchTemplates(query, params);
    } catch (error) {
      logger.error('Failed to search task templates', error);
      throw error;
    }
  });

  ipcMain.handle('task-template:batch-update', async (_, updates) => {
    try {
      return await getAppService().batchUpdateTemplates(updates);
    } catch (error) {
      logger.error('Failed to batch update task templates', error);
      throw error;
    }
  });

  logger.info('Task Template IPC handlers registered');
}
```

### Task 3.3: 创建 TaskInstance IPC Handlers

**文件**: `apps/desktop/src/main/modules/task/ipc/task-instance.ipc-handlers.ts`

```typescript
/**
 * Task Instance IPC Handlers
 */

import { ipcMain } from 'electron';
import { TaskDesktopApplicationService } from '../application/TaskDesktopApplicationService';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('TaskInstanceIPC');

let appService: TaskDesktopApplicationService | null = null;

function getAppService(): TaskDesktopApplicationService {
  if (!appService) {
    appService = new TaskDesktopApplicationService();
  }
  return appService;
}

export function registerTaskInstanceIpcHandlers(): void {
  ipcMain.handle('task-instance:create', async (_, request) => {
    try {
      return await getAppService().createInstance(request);
    } catch (error) {
      logger.error('Failed to create task instance', error);
      throw error;
    }
  });

  ipcMain.handle('task-instance:list', async (_, params) => {
    try {
      return await getAppService().listInstances(params);
    } catch (error) {
      logger.error('Failed to list task instances', error);
      throw error;
    }
  });

  ipcMain.handle('task-instance:get', async (_, uuid) => {
    try {
      return await getAppService().getInstance(uuid);
    } catch (error) {
      logger.error('Failed to get task instance', error);
      throw error;
    }
  });

  ipcMain.handle('task-instance:update', async (_, uuid, request) => {
    try {
      // TODO: 实现 updateInstance
      return { uuid, ...request };
    } catch (error) {
      logger.error('Failed to update task instance', error);
      throw error;
    }
  });

  ipcMain.handle('task-instance:delete', async (_, uuid) => {
    try {
      // TODO: 实现 deleteInstance
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete task instance', error);
      throw error;
    }
  });

  ipcMain.handle('task-instance:complete', async (_, uuid, completion) => {
    try {
      return await getAppService().completeInstance(uuid, completion);
    } catch (error) {
      logger.error('Failed to complete task instance', error);
      throw error;
    }
  });

  ipcMain.handle('task-instance:uncomplete', async (_, uuid) => {
    try {
      return await getAppService().uncompleteInstance(uuid);
    } catch (error) {
      logger.error('Failed to uncomplete task instance', error);
      throw error;
    }
  });

  ipcMain.handle('task-instance:reschedule', async (_, uuid, newDate) => {
    try {
      return await getAppService().rescheduleInstance(uuid, newDate);
    } catch (error) {
      logger.error('Failed to reschedule task instance', error);
      throw error;
    }
  });

  ipcMain.handle('task-instance:skip', async (_, uuid, reason) => {
    try {
      return await getAppService().skipInstance(uuid, reason);
    } catch (error) {
      logger.error('Failed to skip task instance', error);
      throw error;
    }
  });

  ipcMain.handle('task-instance:start', async (_, uuid) => {
    try {
      return await getAppService().startInstance(uuid);
    } catch (error) {
      logger.error('Failed to start task instance', error);
      throw error;
    }
  });

  ipcMain.handle('task-instance:pause', async (_, uuid) => {
    try {
      return await getAppService().pauseInstance(uuid);
    } catch (error) {
      logger.error('Failed to pause task instance', error);
      throw error;
    }
  });

  ipcMain.handle('task-instance:log-time', async (_, uuid, duration, note) => {
    try {
      return await getAppService().logTime(uuid, duration, note);
    } catch (error) {
      logger.error('Failed to log time', error);
      throw error;
    }
  });

  ipcMain.handle('task-instance:list-by-date', async (_, date) => {
    try {
      return await getAppService().listInstancesByDate(date);
    } catch (error) {
      logger.error('Failed to list instances by date', error);
      throw error;
    }
  });

  ipcMain.handle('task-instance:list-by-range', async (_, startDate, endDate) => {
    try {
      return await getAppService().listInstancesByDateRange(startDate, endDate);
    } catch (error) {
      logger.error('Failed to list instances by range', error);
      throw error;
    }
  });

  ipcMain.handle('task-instance:list-by-template', async (_, templateUuid) => {
    try {
      return await getAppService().listInstancesByTemplate(templateUuid);
    } catch (error) {
      logger.error('Failed to list instances by template', error);
      throw error;
    }
  });

  ipcMain.handle('task-instance:batch-update', async (_, updates) => {
    try {
      // TODO: 实现批量更新
      return { success: true, count: updates?.length || 0 };
    } catch (error) {
      logger.error('Failed to batch update instances', error);
      throw error;
    }
  });

  ipcMain.handle('task-instance:batch-complete', async (_, uuids) => {
    try {
      return await getAppService().batchCompleteInstances(uuids);
    } catch (error) {
      logger.error('Failed to batch complete instances', error);
      throw error;
    }
  });

  logger.info('Task Instance IPC handlers registered');
}
```

### Task 3.4: 创建 TaskDependency IPC Handlers

**文件**: `apps/desktop/src/main/modules/task/ipc/task-dependency.ipc-handlers.ts`

```typescript
/**
 * Task Dependency IPC Handlers
 */

import { ipcMain } from 'electron';
import { TaskDesktopApplicationService } from '../application/TaskDesktopApplicationService';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('TaskDependencyIPC');

let appService: TaskDesktopApplicationService | null = null;

function getAppService(): TaskDesktopApplicationService {
  if (!appService) {
    appService = new TaskDesktopApplicationService();
  }
  return appService;
}

export function registerTaskDependencyIpcHandlers(): void {
  ipcMain.handle('task-dependency:create', async (_, request) => {
    try {
      return await getAppService().createDependency(request);
    } catch (error) {
      logger.error('Failed to create task dependency', error);
      throw error;
    }
  });

  ipcMain.handle('task-dependency:list', async (_, taskUuid) => {
    try {
      return await getAppService().listDependencies(taskUuid);
    } catch (error) {
      logger.error('Failed to list task dependencies', error);
      throw error;
    }
  });

  ipcMain.handle('task-dependency:delete', async (_, uuid) => {
    try {
      await getAppService().deleteDependency(uuid);
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete task dependency', error);
      throw error;
    }
  });

  ipcMain.handle('task-dependency:get-blocked', async (_, taskUuid) => {
    try {
      return await getAppService().getBlockedTasks(taskUuid);
    } catch (error) {
      logger.error('Failed to get blocked tasks', error);
      throw error;
    }
  });

  ipcMain.handle('task-dependency:get-blocking', async (_, taskUuid) => {
    try {
      return await getAppService().getBlockingTasks(taskUuid);
    } catch (error) {
      logger.error('Failed to get blocking tasks', error);
      throw error;
    }
  });

  ipcMain.handle('task-dependency:check-circular', async (_, fromUuid, toUuid) => {
    try {
      return await getAppService().checkCircularDependency(fromUuid, toUuid);
    } catch (error) {
      logger.error('Failed to check circular dependency', error);
      throw error;
    }
  });

  logger.info('Task Dependency IPC handlers registered');
}
```

### Task 3.5: 创建 TaskStatistics IPC Handlers

**文件**: `apps/desktop/src/main/modules/task/ipc/task-statistics.ipc-handlers.ts`

```typescript
/**
 * Task Statistics IPC Handlers
 */

import { ipcMain } from 'electron';
import { TaskDesktopApplicationService } from '../application/TaskDesktopApplicationService';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('TaskStatisticsIPC');

let appService: TaskDesktopApplicationService | null = null;

function getAppService(): TaskDesktopApplicationService {
  if (!appService) {
    appService = new TaskDesktopApplicationService();
  }
  return appService;
}

export function registerTaskStatisticsIpcHandlers(): void {
  ipcMain.handle('task-statistics:get-summary', async (_, params) => {
    try {
      return await getAppService().getStatisticsSummary(params);
    } catch (error) {
      logger.error('Failed to get task statistics summary', error);
      throw error;
    }
  });

  ipcMain.handle('task-statistics:get-by-date-range', async (_, startDate, endDate) => {
    try {
      return await getAppService().getStatisticsByDateRange(startDate, endDate);
    } catch (error) {
      logger.error('Failed to get statistics by date range', error);
      throw error;
    }
  });

  ipcMain.handle('task-statistics:get-by-template', async (_, templateUuid) => {
    try {
      return await getAppService().getStatisticsByTemplate(templateUuid);
    } catch (error) {
      logger.error('Failed to get statistics by template', error);
      throw error;
    }
  });

  ipcMain.handle('task-statistics:get-productivity', async (_, date) => {
    try {
      return await getAppService().getProductivity(date);
    } catch (error) {
      logger.error('Failed to get productivity', error);
      throw error;
    }
  });

  ipcMain.handle('task-statistics:get-trends', async (_, days) => {
    try {
      return await getAppService().getTrends(days);
    } catch (error) {
      logger.error('Failed to get trends', error);
      throw error;
    }
  });

  logger.info('Task Statistics IPC handlers registered');
}
```

### Task 3.6: 创建模块入口

**文件**: `apps/desktop/src/main/modules/task/index.ts`

```typescript
/**
 * Task Module - Desktop Main Process
 */

import { registerTaskTemplateIpcHandlers } from './ipc/task-template.ipc-handlers';
import { registerTaskInstanceIpcHandlers } from './ipc/task-instance.ipc-handlers';
import { registerTaskDependencyIpcHandlers } from './ipc/task-dependency.ipc-handlers';
import { registerTaskStatisticsIpcHandlers } from './ipc/task-statistics.ipc-handlers';
import { InitializationManager, InitializationPhase, createLogger } from '@dailyuse/utils';

const logger = createLogger('TaskModule');

export function registerTaskModule(): void {
  InitializationManager.getInstance().registerModule(
    'task',
    InitializationPhase.CORE_SERVICES,
    async () => {
      registerTaskTemplateIpcHandlers();
      registerTaskInstanceIpcHandlers();
      registerTaskDependencyIpcHandlers();
      registerTaskStatisticsIpcHandlers();
      logger.info('Task module initialized');
    }
  );
}

export { TaskDesktopApplicationService } from './application/TaskDesktopApplicationService';
```

---

## 📚 技术上下文

### @dailyuse/application-server/task 可用 Use Cases

```typescript
// Task Template
CreateTaskTemplate, createTaskTemplate
GetTaskTemplate, getTaskTemplate
ListTaskTemplates, listTaskTemplates
ActivateTaskTemplate, activateTaskTemplate
PauseTaskTemplate, pauseTaskTemplate
DeleteTaskTemplate, deleteTaskTemplate

// Task Instance
CompleteTaskInstance, completeTaskInstance
SkipTaskInstance, skipTaskInstance
GetTaskInstancesByDateRange, getTaskInstancesByDateRange

// Dashboard
GetTaskDashboard, getTaskDashboard
```

### 需要在 ApplicationService 中补充的功能

以下功能 `@dailyuse/application-server` 可能没有，需要直接使用 Repository：

- `task-template:restore`
- `task-template:duplicate`
- `task-template:search`
- `task-template:batch-update`
- `task-instance:uncomplete`
- `task-instance:reschedule`
- `task-instance:start`
- `task-instance:pause`
- `task-instance:log-time`
- 所有 `task-dependency:*`

---

## 🔗 依赖关系

- **依赖**: STORY-001 (基础设施准备)
- **被依赖**: 
  - STORY-007 (Dashboard 需要 Task 数据)
  - STORY-004 (Schedule 可能关联 Task)

---

## 📝 备注

- 这是最复杂的模块，预计 16 小时
- 部分功能可能需要扩展 `@dailyuse/application-server` 或 `@dailyuse/domain-server`
- TaskDependency 功能需要确认 Repository 是否在 Container 中注册
- 作为模板供后续模块参考
