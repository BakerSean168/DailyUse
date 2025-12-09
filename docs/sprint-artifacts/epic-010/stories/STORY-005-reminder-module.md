# STORY-005: Reminder 模块完整实现

> **EPIC**: EPIC-010 Desktop 全面 DDD 模块化重构  
> **Sprint**: Sprint 2  
> **预估**: 12 小时  
> **优先级**: P0  
> **依赖**: STORY-001

---

## 📋 概述

Reminder 模块当前全部是 TODO 占位符，需要完整实现：
- ReminderTemplate CRUD (7 channels)
- Upcoming Reminders (5 channels)
- ReminderGroup CRUD (5 channels)
- ReminderStatistics (3 channels)

还需要创建原生通知触发服务。

---

## 🎯 目标

1. 完整实现 Reminder 模块所有 IPC handlers
2. 复用 `@dailyuse/application-server/reminder` 的 Use Cases
3. 实现提醒触发和原生通知集成

---

## ✅ 验收标准 (AC)

### AC-1: ReminderTemplate CRUD
```gherkin
Given ReminderTemplate IPC channels
When 调用以下 channels:
  - reminder:template:create
  - reminder:template:list
  - reminder:template:get
  - reminder:template:update
  - reminder:template:delete
  - reminder:template:activate
  - reminder:template:deactivate
Then 每个 channel 应返回真实数据
```

### AC-2: Upcoming Reminders
```gherkin
Given Upcoming Reminder IPC channels
When 调用以下 channels:
  - reminder:upcoming:list
  - reminder:upcoming:get-next
  - reminder:upcoming:dismiss
  - reminder:upcoming:snooze
  - reminder:upcoming:acknowledge
Then 应正确处理即将到来的提醒
```

### AC-3: ReminderGroup
```gherkin
Given ReminderGroup IPC channels
When 调用以下 channels:
  - reminder:group:create
  - reminder:group:list
  - reminder:group:get
  - reminder:group:update
  - reminder:group:delete
Then 应正确管理提醒分组
```

### AC-4: 原生通知
```gherkin
Given 提醒触发时间到达
When 系统检测到到期提醒
Then 应触发 Electron 原生通知
And 点击通知应能导航到对应提醒
```

---

## 📁 任务清单

### Task 5.1: 创建 ReminderDesktopApplicationService

**文件**: `apps/desktop/src/main/modules/reminder/application/ReminderDesktopApplicationService.ts`

```typescript
/**
 * Reminder Desktop Application Service
 */

import {
  CreateReminderTemplate,
  createReminderTemplate,
  GetReminderTemplate,
  getReminderTemplate,
  ListReminderTemplates,
  listReminderTemplates,
  DeleteReminderTemplate,
  deleteReminderTemplate,
} from '@dailyuse/application-server';
import { ReminderContainer } from '@dailyuse/infrastructure-server';
import type {
  ReminderTemplateClientDTO,
  ReminderGroupClientDTO,
  ReminderInstanceClientDTO,
  CreateReminderTemplateRequest,
  UpdateReminderTemplateRequest,
  ReminderStatsClientDTO,
} from '@dailyuse/contracts/reminder';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ReminderDesktopAppService');

export class ReminderDesktopApplicationService {
  private container: typeof ReminderContainer.prototype;

  constructor() {
    this.container = ReminderContainer.getInstance();
  }

  // ===== Reminder Template =====

  async createTemplate(request: CreateReminderTemplateRequest): Promise<ReminderTemplateClientDTO> {
    logger.debug('Creating reminder template', { title: request.title });
    const result = await createReminderTemplate(
      this.container.getTemplateRepository(),
      {
        accountUuid: request.accountUuid || 'default',
        title: request.title,
        body: request.body,
        type: request.type,
        importance: request.importance,
        triggerType: request.triggerType,
        triggerConfig: request.triggerConfig,
        notificationChannels: request.notificationChannels,
        groupUuid: request.groupUuid,
      }
    );
    return result.template;
  }

  async getTemplate(uuid: string): Promise<ReminderTemplateClientDTO | null> {
    const result = await getReminderTemplate(
      this.container.getTemplateRepository(),
      { uuid }
    );
    return result.template;
  }

  async listTemplates(params?: {
    accountUuid?: string;
    status?: string;
    groupUuid?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    templates: ReminderTemplateClientDTO[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  }> {
    const result = await listReminderTemplates(
      this.container.getTemplateRepository(),
      params || {}
    );
    return {
      templates: result.templates,
      total: result.total,
      page: params?.page || 1,
      pageSize: params?.limit || 20,
      hasMore: (params?.page || 1) * (params?.limit || 20) < result.total,
    };
  }

  async updateTemplate(uuid: string, request: UpdateReminderTemplateRequest): Promise<ReminderTemplateClientDTO> {
    const repo = this.container.getTemplateRepository();
    const template = await repo.findById(uuid);
    if (!template) {
      throw new Error(`Reminder template not found: ${uuid}`);
    }
    if (request.title) template.updateTitle(request.title);
    if (request.body !== undefined) template.updateBody(request.body);
    // ... 其他属性更新
    await repo.save(template);
    return template.toClientDTO();
  }

  async deleteTemplate(uuid: string): Promise<void> {
    await deleteReminderTemplate(
      this.container.getTemplateRepository(),
      { uuid }
    );
  }

  async activateTemplate(uuid: string): Promise<ReminderTemplateClientDTO> {
    const repo = this.container.getTemplateRepository();
    const template = await repo.findById(uuid);
    if (!template) {
      throw new Error(`Reminder template not found: ${uuid}`);
    }
    template.activate();
    await repo.save(template);
    return template.toClientDTO();
  }

  async deactivateTemplate(uuid: string): Promise<ReminderTemplateClientDTO> {
    const repo = this.container.getTemplateRepository();
    const template = await repo.findById(uuid);
    if (!template) {
      throw new Error(`Reminder template not found: ${uuid}`);
    }
    template.deactivate();
    await repo.save(template);
    return template.toClientDTO();
  }

  // ===== Upcoming Reminders =====

  async listUpcoming(params?: {
    fromDate?: number;
    toDate?: number;
    limit?: number;
  }): Promise<{
    reminders: ReminderInstanceClientDTO[];
    total: number;
    fromDate: number;
    toDate: number;
  }> {
    const now = Date.now();
    const fromDate = params?.fromDate || now;
    const toDate = params?.toDate || now + 7 * 24 * 60 * 60 * 1000; // 默认7天

    // TODO: 使用 ReminderSchedulerService 计算即将到来的提醒
    const { ReminderSchedulerService } = await import('@dailyuse/domain-server/reminder');
    const scheduler = new ReminderSchedulerService();

    // 获取所有激活的模板
    const templates = await this.container.getTemplateRepository().findActive();
    const upcomingReminders: ReminderInstanceClientDTO[] = [];

    for (const template of templates) {
      const nextTrigger = scheduler.getNextTriggerTime(template, fromDate);
      if (nextTrigger && nextTrigger <= toDate) {
        // 创建虚拟实例用于展示
        upcomingReminders.push({
          uuid: `upcoming-${template.uuid}-${nextTrigger}`,
          templateUuid: template.uuid,
          title: template.title,
          body: template.body || '',
          scheduledTime: nextTrigger,
          status: 'pending',
          importance: template.importance,
        } as ReminderInstanceClientDTO);
      }
    }

    // 按时间排序
    upcomingReminders.sort((a, b) => a.scheduledTime - b.scheduledTime);

    return {
      reminders: params?.limit ? upcomingReminders.slice(0, params.limit) : upcomingReminders,
      total: upcomingReminders.length,
      fromDate,
      toDate,
    };
  }

  async getNextReminders(count: number = 5): Promise<{ reminders: ReminderInstanceClientDTO[] }> {
    const result = await this.listUpcoming({ limit: count });
    return { reminders: result.reminders };
  }

  async dismissReminder(uuid: string): Promise<{ success: boolean }> {
    // TODO: 记录 dismissed 状态
    logger.info('Reminder dismissed', { uuid });
    return { success: true };
  }

  async snoozeReminder(uuid: string, duration: number): Promise<{
    success: boolean;
    newTime: number | null;
  }> {
    const newTime = Date.now() + duration;
    logger.info('Reminder snoozed', { uuid, newTime });
    return { success: true, newTime };
  }

  async acknowledgeReminder(uuid: string): Promise<{ success: boolean }> {
    logger.info('Reminder acknowledged', { uuid });
    return { success: true };
  }

  // ===== Reminder Group =====

  async createGroup(request: {
    accountUuid: string;
    name: string;
    description?: string;
    color?: string;
  }): Promise<ReminderGroupClientDTO> {
    const repo = this.container.getGroupRepository();
    const { ReminderGroup } = await import('@dailyuse/domain-server/reminder');
    const group = ReminderGroup.create(request);
    await repo.save(group);
    return group.toClientDTO();
  }

  async listGroups(params?: {
    accountUuid?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    groups: ReminderGroupClientDTO[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  }> {
    const repo = this.container.getGroupRepository();
    const groups = await repo.findByAccountUuid(params?.accountUuid || 'default');
    return {
      groups: groups.map(g => g.toClientDTO()),
      total: groups.length,
      page: params?.page || 1,
      pageSize: params?.limit || 20,
      hasMore: false,
    };
  }

  async getGroup(uuid: string): Promise<ReminderGroupClientDTO | null> {
    const repo = this.container.getGroupRepository();
    const group = await repo.findById(uuid);
    return group?.toClientDTO() ?? null;
  }

  async updateGroup(uuid: string, request: {
    name?: string;
    description?: string;
    color?: string;
  }): Promise<ReminderGroupClientDTO> {
    const repo = this.container.getGroupRepository();
    const group = await repo.findById(uuid);
    if (!group) {
      throw new Error(`Reminder group not found: ${uuid}`);
    }
    if (request.name) group.updateName(request.name);
    if (request.description !== undefined) group.updateDescription(request.description);
    if (request.color) group.updateColor(request.color);
    await repo.save(group);
    return group.toClientDTO();
  }

  async deleteGroup(uuid: string): Promise<void> {
    const repo = this.container.getGroupRepository();
    await repo.delete(uuid);
  }

  // ===== Statistics =====

  async getStatisticsSummary(params?: { accountUuid?: string }): Promise<{
    total: number;
    active: number;
    completed: number;
    snoozed: number;
    dismissed: number;
  }> {
    const statsRepo = this.container.getStatisticsRepository();
    return statsRepo.getSummary(params?.accountUuid || 'default');
  }

  async getStatisticsByDateRange(startDate: number, endDate: number): Promise<{
    data: Array<{ date: number; triggered: number; acknowledged: number; dismissed: number }>;
  }> {
    const statsRepo = this.container.getStatisticsRepository();
    return { data: await statsRepo.getByDateRange(startDate, endDate) };
  }

  async getCompletionRate(): Promise<{ rate: number }> {
    const statsRepo = this.container.getStatisticsRepository();
    return { rate: await statsRepo.getCompletionRate() };
  }
}
```

### Task 5.2: 创建原生通知服务

**文件**: `apps/desktop/src/main/modules/reminder/services/ReminderNativeNotificationService.ts`

```typescript
/**
 * Reminder Native Notification Service
 * 
 * 负责触发 Electron 原生系统通知
 */

import { Notification, BrowserWindow } from 'electron';
import { eventBus, createLogger } from '@dailyuse/utils';
import type { ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';

const logger = createLogger('ReminderNativeNotification');

export class ReminderNativeNotificationService {
  private static instance: ReminderNativeNotificationService;
  private mainWindow: BrowserWindow | null = null;
  private checkInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initEventListeners();
  }

  static getInstance(): ReminderNativeNotificationService {
    if (!ReminderNativeNotificationService.instance) {
      ReminderNativeNotificationService.instance = new ReminderNativeNotificationService();
    }
    return ReminderNativeNotificationService.instance;
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  /**
   * 启动提醒检查定时器
   */
  startReminderChecker(intervalMs: number = 60000): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      this.checkDueReminders();
    }, intervalMs);

    logger.info('Reminder checker started', { intervalMs });
  }

  /**
   * 停止提醒检查
   */
  stopReminderChecker(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      logger.info('Reminder checker stopped');
    }
  }

  /**
   * 检查到期提醒
   */
  private async checkDueReminders(): Promise<void> {
    try {
      // 发送事件让 Application Service 检查
      eventBus.emit('reminder.check.due', { timestamp: Date.now() });
    } catch (error) {
      logger.error('Failed to check due reminders', error);
    }
  }

  /**
   * 显示提醒通知
   */
  showReminderNotification(reminder: {
    uuid: string;
    templateUuid: string;
    title: string;
    body?: string;
    importance?: string;
  }): Notification | null {
    if (!Notification.isSupported()) {
      logger.warn('Notifications not supported');
      return null;
    }

    const urgency = reminder.importance === 'vital' || reminder.importance === 'important'
      ? 'critical' as const
      : 'normal' as const;

    const notification = new Notification({
      title: `🔔 ${reminder.title}`,
      body: reminder.body || '',
      urgency,
      silent: false,
    });

    notification.on('click', () => {
      this.handleNotificationClick(reminder);
    });

    notification.on('close', () => {
      logger.debug('Reminder notification closed', { uuid: reminder.uuid });
    });

    notification.show();
    logger.info('Reminder notification shown', { uuid: reminder.uuid });

    return notification;
  }

  /**
   * 处理通知点击
   */
  private handleNotificationClick(reminder: {
    uuid: string;
    templateUuid: string;
  }): void {
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
      this.mainWindow.focus();

      // 发送 IPC 到渲染进程
      this.mainWindow.webContents.send('reminder:notification:clicked', {
        uuid: reminder.uuid,
        templateUuid: reminder.templateUuid,
      });
    }
  }

  /**
   * 初始化事件监听
   */
  private initEventListeners(): void {
    // 监听提醒触发事件
    eventBus.on('reminder.triggered', (data: {
      uuid: string;
      templateUuid: string;
      title: string;
      body?: string;
      importance?: string;
    }) => {
      this.showReminderNotification(data);
    });
  }
}
```

### Task 5.3: 创建 ReminderTemplate IPC Handlers

**文件**: `apps/desktop/src/main/modules/reminder/ipc/reminder-template.ipc-handlers.ts`

```typescript
/**
 * Reminder Template IPC Handlers
 */

import { ipcMain } from 'electron';
import { ReminderDesktopApplicationService } from '../application/ReminderDesktopApplicationService';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ReminderTemplateIPC');

let appService: ReminderDesktopApplicationService | null = null;

function getAppService(): ReminderDesktopApplicationService {
  if (!appService) {
    appService = new ReminderDesktopApplicationService();
  }
  return appService;
}

export function registerReminderTemplateIpcHandlers(): void {
  ipcMain.handle('reminder:template:create', async (_, request) => {
    try {
      return await getAppService().createTemplate(request);
    } catch (error) {
      logger.error('Failed to create reminder template', error);
      throw error;
    }
  });

  ipcMain.handle('reminder:template:list', async (_, params) => {
    try {
      return await getAppService().listTemplates(params);
    } catch (error) {
      logger.error('Failed to list reminder templates', error);
      throw error;
    }
  });

  ipcMain.handle('reminder:template:get', async (_, uuid) => {
    try {
      return await getAppService().getTemplate(uuid);
    } catch (error) {
      logger.error('Failed to get reminder template', error);
      throw error;
    }
  });

  ipcMain.handle('reminder:template:update', async (_, uuid, request) => {
    try {
      return await getAppService().updateTemplate(uuid, request);
    } catch (error) {
      logger.error('Failed to update reminder template', error);
      throw error;
    }
  });

  ipcMain.handle('reminder:template:delete', async (_, uuid) => {
    try {
      await getAppService().deleteTemplate(uuid);
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete reminder template', error);
      throw error;
    }
  });

  ipcMain.handle('reminder:template:activate', async (_, uuid) => {
    try {
      return await getAppService().activateTemplate(uuid);
    } catch (error) {
      logger.error('Failed to activate reminder template', error);
      throw error;
    }
  });

  ipcMain.handle('reminder:template:deactivate', async (_, uuid) => {
    try {
      return await getAppService().deactivateTemplate(uuid);
    } catch (error) {
      logger.error('Failed to deactivate reminder template', error);
      throw error;
    }
  });

  logger.info('Reminder Template IPC handlers registered');
}
```

### Task 5.4: 创建 Upcoming、Group、Statistics IPC Handlers

（类似结构，为节省篇幅省略详细代码）

### Task 5.5: 创建模块入口

**文件**: `apps/desktop/src/main/modules/reminder/index.ts`

```typescript
/**
 * Reminder Module - Desktop Main Process
 */

import { registerReminderTemplateIpcHandlers } from './ipc/reminder-template.ipc-handlers';
import { registerReminderUpcomingIpcHandlers } from './ipc/reminder-upcoming.ipc-handlers';
import { registerReminderGroupIpcHandlers } from './ipc/reminder-group.ipc-handlers';
import { registerReminderStatisticsIpcHandlers } from './ipc/reminder-statistics.ipc-handlers';
import { ReminderNativeNotificationService } from './services/ReminderNativeNotificationService';
import { InitializationManager, InitializationPhase, createLogger } from '@dailyuse/utils';

const logger = createLogger('ReminderModule');

export function registerReminderModule(): void {
  InitializationManager.getInstance().registerModule(
    'reminder',
    InitializationPhase.CORE_SERVICES,
    async () => {
      // 注册 IPC handlers
      registerReminderTemplateIpcHandlers();
      registerReminderUpcomingIpcHandlers();
      registerReminderGroupIpcHandlers();
      registerReminderStatisticsIpcHandlers();

      // 启动提醒检查服务
      const notificationService = ReminderNativeNotificationService.getInstance();
      notificationService.startReminderChecker(60000); // 每分钟检查

      logger.info('Reminder module initialized');
    }
  );
}

export { ReminderDesktopApplicationService } from './application/ReminderDesktopApplicationService';
export { ReminderNativeNotificationService } from './services/ReminderNativeNotificationService';
```

---

## 📚 技术上下文

### @dailyuse/application-server/reminder 可用 Use Cases

```typescript
CreateReminderTemplate, createReminderTemplate
GetReminderTemplate, getReminderTemplate
ListReminderTemplates, listReminderTemplates
DeleteReminderTemplate, deleteReminderTemplate
```

### @dailyuse/domain-server/reminder 可用服务

```typescript
ReminderSchedulerService  // 计算下次触发时间
ReminderTriggerService    // 触发提醒
ReminderTemplate          // 领域实体
ReminderGroup             // 分组实体
```

---

## 🔗 依赖关系

- **依赖**: STORY-001 (基础设施准备)
- **被依赖**: 
  - STORY-006 (Notification 需要集成)
  - STORY-007 (Dashboard 需要 Reminder 数据)

---

## 📝 备注

- 需要实现定时检查到期提醒的机制
- 原生通知服务需要与 STORY-006 的 Notification 模块协调
- Snooze 功能需要持久化新的触发时间
