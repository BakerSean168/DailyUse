# STORY-004: Schedule 模块完整实现

> **EPIC**: EPIC-010 Desktop 全面 DDD 模块化重构  
> **Sprint**: Sprint 2  
> **预估**: 12 小时  
> **优先级**: P0  
> **依赖**: STORY-001

---

## 📋 概述

Schedule 模块当前全部是 TODO 占位符，需要完整实现：
- ScheduleTask CRUD (9 channels)
- ScheduleEvent CRUD (10 channels)
- ScheduleStatistics (3 channels)

---

## 🎯 目标

1. 完整实现 Schedule 模块所有 IPC handlers
2. 复用 `@dailyuse/application-server/schedule` 的 Use Cases
3. 支持日程任务的创建、调度、重排

---

## ✅ 验收标准 (AC)

### AC-1: ScheduleTask CRUD
```gherkin
Given ScheduleTask IPC channels
When 调用以下 channels:
  - schedule:task:create
  - schedule:task:list
  - schedule:task:get
  - schedule:task:update
  - schedule:task:delete
  - schedule:task:list-by-date
  - schedule:task:list-by-range
  - schedule:task:reschedule
  - schedule:task:batch-reschedule
Then 每个 channel 应返回真实数据
```

### AC-2: ScheduleEvent CRUD
```gherkin
Given ScheduleEvent IPC channels
When 调用以下 channels:
  - schedule:event:create
  - schedule:event:list
  - schedule:event:get
  - schedule:event:update
  - schedule:event:delete
  - schedule:event:list-by-date
  - schedule:event:list-by-range
  - schedule:event:list-recurring
  - schedule:event:update-recurring
  - schedule:event:delete-recurring
Then 每个 channel 应返回真实数据
```

### AC-3: ScheduleStatistics
```gherkin
Given ScheduleStatistics IPC channels
When 调用以下 channels:
  - schedule:statistics:get-summary
  - schedule:statistics:get-by-date-range
  - schedule:statistics:get-upcoming
Then 应返回正确的统计数据
```

---

## 📁 任务清单

### Task 4.1: 创建 ScheduleDesktopApplicationService

**文件**: `apps/desktop/src/main/modules/schedule/application/ScheduleDesktopApplicationService.ts`

```typescript
/**
 * Schedule Desktop Application Service
 */

import {
  CreateScheduleTask,
  createScheduleTask,
  GetScheduleTask,
  getScheduleTask,
  ListScheduleTasks,
  listScheduleTasks,
  PauseScheduleTask,
  pauseScheduleTask,
  ResumeScheduleTask,
  resumeScheduleTask,
  DeleteScheduleTask,
  deleteScheduleTask,
  FindDueTasks,
  findDueTasks,
} from '@dailyuse/application-server';
import { ScheduleContainer } from '@dailyuse/infrastructure-server';
import type {
  ScheduleTaskClientDTO,
  ScheduleClientDTO,
  CreateScheduleTaskRequest,
  UpdateScheduleTaskRequest,
  CreateScheduleRequest,
  UpdateScheduleRequest,
  ScheduleStatisticsClientDTO,
} from '@dailyuse/contracts/schedule';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ScheduleDesktopAppService');

export class ScheduleDesktopApplicationService {
  private container: typeof ScheduleContainer.prototype;

  constructor() {
    this.container = ScheduleContainer.getInstance();
  }

  // ===== Schedule Task =====

  async createTask(request: CreateScheduleTaskRequest): Promise<ScheduleTaskClientDTO> {
    logger.debug('Creating schedule task', { title: request.title });
    const result = await createScheduleTask(
      this.container.getScheduleTaskRepository(),
      {
        accountUuid: request.accountUuid || 'default',
        title: request.title,
        description: request.description,
        sourceModule: request.sourceModule,
        sourceUuid: request.sourceUuid,
        scheduledDate: request.scheduledDate,
        startTime: request.startTime,
        endTime: request.endTime,
        duration: request.duration,
        priority: request.priority,
        isAllDay: request.isAllDay,
      }
    );
    return result.task;
  }

  async getTask(uuid: string): Promise<ScheduleTaskClientDTO | null> {
    const result = await getScheduleTask(
      this.container.getScheduleTaskRepository(),
      { uuid }
    );
    return result.task;
  }

  async listTasks(params?: {
    accountUuid?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: ScheduleTaskClientDTO[]; total: number }> {
    const result = await listScheduleTasks(
      this.container.getScheduleTaskRepository(),
      params || {}
    );
    return {
      items: result.tasks,
      total: result.total,
    };
  }

  async updateTask(uuid: string, request: UpdateScheduleTaskRequest): Promise<ScheduleTaskClientDTO> {
    const repo = this.container.getScheduleTaskRepository();
    const task = await repo.findById(uuid);
    if (!task) {
      throw new Error(`Schedule task not found: ${uuid}`);
    }
    // 更新任务属性
    if (request.title) task.updateTitle(request.title);
    if (request.description !== undefined) task.updateDescription(request.description);
    if (request.scheduledDate) task.reschedule(request.scheduledDate, request.startTime, request.endTime);
    await repo.save(task);
    return task.toClientDTO();
  }

  async deleteTask(uuid: string): Promise<void> {
    await deleteScheduleTask(
      this.container.getScheduleTaskRepository(),
      { uuid }
    );
  }

  async listTasksByDate(date: number): Promise<{ items: ScheduleTaskClientDTO[]; total: number }> {
    const repo = this.container.getScheduleTaskRepository();
    const tasks = await repo.findByDate(date);
    return {
      items: tasks.map(t => t.toClientDTO()),
      total: tasks.length,
    };
  }

  async listTasksByRange(startDate: number, endDate: number): Promise<{
    items: ScheduleTaskClientDTO[];
    total: number;
  }> {
    const repo = this.container.getScheduleTaskRepository();
    const tasks = await repo.findByDateRange(startDate, endDate);
    return {
      items: tasks.map(t => t.toClientDTO()),
      total: tasks.length,
    };
  }

  async rescheduleTask(uuid: string, newDate: number, newTime?: string): Promise<ScheduleTaskClientDTO> {
    const repo = this.container.getScheduleTaskRepository();
    const task = await repo.findById(uuid);
    if (!task) {
      throw new Error(`Schedule task not found: ${uuid}`);
    }
    task.reschedule(newDate, newTime);
    await repo.save(task);
    return task.toClientDTO();
  }

  async batchReschedule(updates: Array<{ uuid: string; newDate: number; newTime?: string }>): Promise<{
    success: boolean;
    count: number;
  }> {
    let count = 0;
    for (const update of updates) {
      try {
        await this.rescheduleTask(update.uuid, update.newDate, update.newTime);
        count++;
      } catch (error) {
        logger.warn(`Failed to reschedule task ${update.uuid}`, error);
      }
    }
    return { success: true, count };
  }

  // ===== Schedule Event =====

  async createEvent(request: CreateScheduleRequest): Promise<ScheduleClientDTO> {
    // TODO: 实现事件创建
    throw new Error('Not implemented');
  }

  async getEvent(uuid: string): Promise<ScheduleClientDTO | null> {
    // TODO: 实现
    return null;
  }

  async listEvents(params?: { page?: number; limit?: number }): Promise<{
    events: ScheduleClientDTO[];
    total: number;
  }> {
    return { events: [], total: 0 };
  }

  async updateEvent(uuid: string, request: UpdateScheduleRequest): Promise<ScheduleClientDTO> {
    throw new Error('Not implemented');
  }

  async deleteEvent(uuid: string): Promise<void> {
    // TODO: 实现
  }

  async listEventsByDate(date: number): Promise<{ events: ScheduleClientDTO[]; total: number }> {
    return { events: [], total: 0 };
  }

  async listEventsByRange(startDate: number, endDate: number): Promise<{
    events: ScheduleClientDTO[];
    total: number;
  }> {
    return { events: [], total: 0 };
  }

  async listRecurringEvents(): Promise<{ events: ScheduleClientDTO[]; total: number }> {
    return { events: [], total: 0 };
  }

  async updateRecurringEvent(uuid: string, request: UpdateScheduleRequest, scope: 'this' | 'following' | 'all'): Promise<{
    success: boolean;
  }> {
    return { success: true };
  }

  async deleteRecurringEvent(uuid: string, scope: 'this' | 'following' | 'all'): Promise<{
    success: boolean;
  }> {
    return { success: true };
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
    data: Array<{ date: number; scheduled: number; completed: number }>;
  }> {
    const statsRepo = this.container.getStatisticsRepository();
    return { data: await statsRepo.getByDateRange(startDate, endDate) };
  }

  async getUpcomingTasks(days: number = 7): Promise<{ tasks: ScheduleTaskClientDTO[] }> {
    const result = await findDueTasks(
      this.container.getScheduleTaskRepository(),
      { days }
    );
    return { tasks: result.tasks };
  }
}
```

### Task 4.2: 创建 ScheduleTask IPC Handlers

**文件**: `apps/desktop/src/main/modules/schedule/ipc/schedule-task.ipc-handlers.ts`

```typescript
/**
 * Schedule Task IPC Handlers
 */

import { ipcMain } from 'electron';
import { ScheduleDesktopApplicationService } from '../application/ScheduleDesktopApplicationService';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ScheduleTaskIPC');

let appService: ScheduleDesktopApplicationService | null = null;

function getAppService(): ScheduleDesktopApplicationService {
  if (!appService) {
    appService = new ScheduleDesktopApplicationService();
  }
  return appService;
}

export function registerScheduleTaskIpcHandlers(): void {
  ipcMain.handle('schedule:task:create', async (_, request) => {
    try {
      return await getAppService().createTask(request);
    } catch (error) {
      logger.error('Failed to create schedule task', error);
      throw error;
    }
  });

  ipcMain.handle('schedule:task:list', async (_, params) => {
    try {
      return await getAppService().listTasks(params);
    } catch (error) {
      logger.error('Failed to list schedule tasks', error);
      throw error;
    }
  });

  ipcMain.handle('schedule:task:get', async (_, uuid) => {
    try {
      return await getAppService().getTask(uuid);
    } catch (error) {
      logger.error('Failed to get schedule task', error);
      throw error;
    }
  });

  ipcMain.handle('schedule:task:update', async (_, uuid, request) => {
    try {
      return await getAppService().updateTask(uuid, request);
    } catch (error) {
      logger.error('Failed to update schedule task', error);
      throw error;
    }
  });

  ipcMain.handle('schedule:task:delete', async (_, uuid) => {
    try {
      await getAppService().deleteTask(uuid);
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete schedule task', error);
      throw error;
    }
  });

  ipcMain.handle('schedule:task:list-by-date', async (_, date) => {
    try {
      return await getAppService().listTasksByDate(date);
    } catch (error) {
      logger.error('Failed to list tasks by date', error);
      throw error;
    }
  });

  ipcMain.handle('schedule:task:list-by-range', async (_, startDate, endDate) => {
    try {
      return await getAppService().listTasksByRange(startDate, endDate);
    } catch (error) {
      logger.error('Failed to list tasks by range', error);
      throw error;
    }
  });

  ipcMain.handle('schedule:task:reschedule', async (_, uuid, newDate, newTime) => {
    try {
      return await getAppService().rescheduleTask(uuid, newDate, newTime);
    } catch (error) {
      logger.error('Failed to reschedule task', error);
      throw error;
    }
  });

  ipcMain.handle('schedule:task:batch-reschedule', async (_, updates) => {
    try {
      return await getAppService().batchReschedule(updates);
    } catch (error) {
      logger.error('Failed to batch reschedule', error);
      throw error;
    }
  });

  logger.info('Schedule Task IPC handlers registered');
}
```

### Task 4.3: 创建 ScheduleEvent IPC Handlers

**文件**: `apps/desktop/src/main/modules/schedule/ipc/schedule-event.ipc-handlers.ts`

```typescript
/**
 * Schedule Event IPC Handlers
 */

import { ipcMain } from 'electron';
import { ScheduleDesktopApplicationService } from '../application/ScheduleDesktopApplicationService';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ScheduleEventIPC');

let appService: ScheduleDesktopApplicationService | null = null;

function getAppService(): ScheduleDesktopApplicationService {
  if (!appService) {
    appService = new ScheduleDesktopApplicationService();
  }
  return appService;
}

export function registerScheduleEventIpcHandlers(): void {
  ipcMain.handle('schedule:event:create', async (_, request) => {
    try {
      return await getAppService().createEvent(request);
    } catch (error) {
      logger.error('Failed to create schedule event', error);
      throw error;
    }
  });

  ipcMain.handle('schedule:event:list', async (_, params) => {
    try {
      return await getAppService().listEvents(params);
    } catch (error) {
      logger.error('Failed to list schedule events', error);
      throw error;
    }
  });

  ipcMain.handle('schedule:event:get', async (_, uuid) => {
    try {
      return await getAppService().getEvent(uuid);
    } catch (error) {
      logger.error('Failed to get schedule event', error);
      throw error;
    }
  });

  ipcMain.handle('schedule:event:update', async (_, uuid, request) => {
    try {
      return await getAppService().updateEvent(uuid, request);
    } catch (error) {
      logger.error('Failed to update schedule event', error);
      throw error;
    }
  });

  ipcMain.handle('schedule:event:delete', async (_, uuid) => {
    try {
      await getAppService().deleteEvent(uuid);
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete schedule event', error);
      throw error;
    }
  });

  ipcMain.handle('schedule:event:list-by-date', async (_, date) => {
    try {
      return await getAppService().listEventsByDate(date);
    } catch (error) {
      logger.error('Failed to list events by date', error);
      throw error;
    }
  });

  ipcMain.handle('schedule:event:list-by-range', async (_, startDate, endDate) => {
    try {
      return await getAppService().listEventsByRange(startDate, endDate);
    } catch (error) {
      logger.error('Failed to list events by range', error);
      throw error;
    }
  });

  ipcMain.handle('schedule:event:list-recurring', async (_, params) => {
    try {
      return await getAppService().listRecurringEvents();
    } catch (error) {
      logger.error('Failed to list recurring events', error);
      throw error;
    }
  });

  ipcMain.handle('schedule:event:update-recurring', async (_, uuid, request, scope) => {
    try {
      return await getAppService().updateRecurringEvent(uuid, request, scope);
    } catch (error) {
      logger.error('Failed to update recurring event', error);
      throw error;
    }
  });

  ipcMain.handle('schedule:event:delete-recurring', async (_, uuid, scope) => {
    try {
      return await getAppService().deleteRecurringEvent(uuid, scope);
    } catch (error) {
      logger.error('Failed to delete recurring event', error);
      throw error;
    }
  });

  logger.info('Schedule Event IPC handlers registered');
}
```

### Task 4.4: 创建 ScheduleStatistics IPC Handlers

**文件**: `apps/desktop/src/main/modules/schedule/ipc/schedule-statistics.ipc-handlers.ts`

```typescript
/**
 * Schedule Statistics IPC Handlers
 */

import { ipcMain } from 'electron';
import { ScheduleDesktopApplicationService } from '../application/ScheduleDesktopApplicationService';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ScheduleStatisticsIPC');

let appService: ScheduleDesktopApplicationService | null = null;

function getAppService(): ScheduleDesktopApplicationService {
  if (!appService) {
    appService = new ScheduleDesktopApplicationService();
  }
  return appService;
}

export function registerScheduleStatisticsIpcHandlers(): void {
  ipcMain.handle('schedule:statistics:get-summary', async (_, params) => {
    try {
      return await getAppService().getStatisticsSummary(params);
    } catch (error) {
      logger.error('Failed to get schedule statistics summary', error);
      throw error;
    }
  });

  ipcMain.handle('schedule:statistics:get-by-date-range', async (_, startDate, endDate) => {
    try {
      return await getAppService().getStatisticsByDateRange(startDate, endDate);
    } catch (error) {
      logger.error('Failed to get statistics by date range', error);
      throw error;
    }
  });

  ipcMain.handle('schedule:statistics:get-upcoming', async (_, days) => {
    try {
      return await getAppService().getUpcomingTasks(days);
    } catch (error) {
      logger.error('Failed to get upcoming tasks', error);
      throw error;
    }
  });

  logger.info('Schedule Statistics IPC handlers registered');
}
```

### Task 4.5: 创建模块入口

**文件**: `apps/desktop/src/main/modules/schedule/index.ts`

```typescript
/**
 * Schedule Module - Desktop Main Process
 */

import { registerScheduleTaskIpcHandlers } from './ipc/schedule-task.ipc-handlers';
import { registerScheduleEventIpcHandlers } from './ipc/schedule-event.ipc-handlers';
import { registerScheduleStatisticsIpcHandlers } from './ipc/schedule-statistics.ipc-handlers';
import { InitializationManager, InitializationPhase, createLogger } from '@dailyuse/utils';

const logger = createLogger('ScheduleModule');

export function registerScheduleModule(): void {
  InitializationManager.getInstance().registerModule(
    'schedule',
    InitializationPhase.CORE_SERVICES,
    async () => {
      registerScheduleTaskIpcHandlers();
      registerScheduleEventIpcHandlers();
      registerScheduleStatisticsIpcHandlers();
      logger.info('Schedule module initialized');
    }
  );
}

export { ScheduleDesktopApplicationService } from './application/ScheduleDesktopApplicationService';
```

---

## 📚 技术上下文

### @dailyuse/application-server/schedule 可用 Use Cases

```typescript
CreateScheduleTask, createScheduleTask
GetScheduleTask, getScheduleTask
ListScheduleTasks, listScheduleTasks
PauseScheduleTask, pauseScheduleTask
ResumeScheduleTask, resumeScheduleTask
DeleteScheduleTask, deleteScheduleTask
FindDueTasks, findDueTasks
```

### 需要补充实现的功能

- `schedule:event:*` - Event 相关功能需要确认 domain-server 支持
- `schedule:task:reschedule` - 可能需要直接使用 Repository
- `schedule:task:batch-reschedule` - 需要直接实现

---

## 🔗 依赖关系

- **依赖**: STORY-001 (基础设施准备)
- **被依赖**: STORY-007 (Dashboard 需要 Schedule 数据)

---

## 📝 备注

- ScheduleEvent 和 ScheduleTask 可能是不同的概念，需要确认领域模型
- 循环事件（recurring）处理较复杂，可能需要特殊处理
