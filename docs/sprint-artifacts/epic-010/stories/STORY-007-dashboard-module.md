# STORY-007: Dashboard 模块实现

> **EPIC**: EPIC-010 Desktop 全面 DDD 模块化重构  
> **Sprint**: Sprint 3  
> **预估**: 6 小时  
> **优先级**: P1  
> **依赖**: STORY-002, STORY-003, STORY-004, STORY-005

---

## 📋 概述

Dashboard 模块负责聚合各模块数据，为用户提供统一的数据视图：
- 今日任务统计
- 近期目标进度
- 即将到来的日程
- 待处理提醒
- 通知计数

---

## 🎯 目标

1. 创建 Dashboard 聚合服务，统一获取各模块概览数据
2. 复用各模块的 Application Service
3. 提供高效的批量数据加载

---

## ✅ 验收标准 (AC)

### AC-1: Dashboard 概览
```gherkin
Given Dashboard IPC channels
When 调用 dashboard:get-overview
Then 应返回聚合数据:
  - taskSummary: 今日任务统计
  - goalSummary: 活跃目标进度
  - upcomingSchedules: 近期日程
  - upcomingReminders: 近期提醒
  - notificationCount: 未读通知数
```

### AC-2: 分块加载
```gherkin
Given 用户只需要部分数据
When 调用 dashboard:get-section (section: 'tasks' | 'goals' | 'schedules' | 'reminders')
Then 应只返回对应板块的数据
```

### AC-3: 刷新机制
```gherkin
Given Dashboard 已显示
When 调用 dashboard:refresh
Then 应触发所有数据重新加载
And 发送 dashboard:updated 事件到渲染进程
```

---

## 📁 任务清单

### Task 7.1: 创建 DashboardDesktopApplicationService

**文件**: `apps/desktop/src/main/modules/dashboard/application/DashboardDesktopApplicationService.ts`

```typescript
/**
 * Dashboard Desktop Application Service
 * 
 * 聚合各模块数据，提供统一的 Dashboard 数据服务
 */

import { createLogger, eventBus } from '@dailyuse/utils';
import { GoalDesktopApplicationService } from '../../goal/application/GoalDesktopApplicationService';
import { TaskDesktopApplicationService } from '../../task/application/TaskDesktopApplicationService';
import { ScheduleDesktopApplicationService } from '../../schedule/application/ScheduleDesktopApplicationService';
import { ReminderDesktopApplicationService } from '../../reminder/application/ReminderDesktopApplicationService';
import { getNotificationAppService } from '../../notification/ipc/notification.ipc-handlers';
import type {
  GoalClientDTO,
  TaskInstanceClientDTO,
  ScheduleEventClientDTO,
  ReminderInstanceClientDTO,
} from '@dailyuse/contracts';

const logger = createLogger('DashboardDesktopAppService');

export interface DashboardOverview {
  taskSummary: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    completionRate: number;
  };
  goalSummary: {
    total: number;
    activeGoals: Array<{
      uuid: string;
      title: string;
      progress: number;
      dueDate?: number;
    }>;
  };
  upcomingSchedules: {
    count: number;
    items: Array<{
      uuid: string;
      title: string;
      startTime: number;
      endTime?: number;
      type: string;
    }>;
  };
  upcomingReminders: {
    count: number;
    items: Array<{
      uuid: string;
      title: string;
      scheduledTime: number;
    }>;
  };
  notificationCount: number;
  lastUpdated: number;
}

export interface DashboardSectionData {
  section: string;
  data: unknown;
  lastUpdated: number;
}

export class DashboardDesktopApplicationService {
  private goalService: GoalDesktopApplicationService;
  private taskService: TaskDesktopApplicationService;
  private scheduleService: ScheduleDesktopApplicationService;
  private reminderService: ReminderDesktopApplicationService;
  private cachedOverview: DashboardOverview | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL = 30000; // 30秒缓存

  constructor() {
    this.goalService = new GoalDesktopApplicationService();
    this.taskService = new TaskDesktopApplicationService();
    this.scheduleService = new ScheduleDesktopApplicationService();
    this.reminderService = new ReminderDesktopApplicationService();
    
    this.initEventListeners();
  }

  /**
   * 获取 Dashboard 完整概览
   */
  async getOverview(forceRefresh: boolean = false): Promise<DashboardOverview> {
    // 检查缓存
    if (!forceRefresh && this.cachedOverview && Date.now() < this.cacheExpiry) {
      logger.debug('Returning cached dashboard overview');
      return this.cachedOverview;
    }

    logger.info('Fetching dashboard overview');

    const [taskSummary, goalSummary, upcomingSchedules, upcomingReminders, notificationCount] = 
      await Promise.all([
        this.getTaskSummary(),
        this.getGoalSummary(),
        this.getUpcomingSchedules(),
        this.getUpcomingReminders(),
        this.getNotificationCount(),
      ]);

    const overview: DashboardOverview = {
      taskSummary,
      goalSummary,
      upcomingSchedules,
      upcomingReminders,
      notificationCount,
      lastUpdated: Date.now(),
    };

    // 更新缓存
    this.cachedOverview = overview;
    this.cacheExpiry = Date.now() + this.CACHE_TTL;

    return overview;
  }

  /**
   * 获取单个板块数据
   */
  async getSection(section: 'tasks' | 'goals' | 'schedules' | 'reminders' | 'notifications'): Promise<DashboardSectionData> {
    let data: unknown;

    switch (section) {
      case 'tasks':
        data = await this.getTaskSummary();
        break;
      case 'goals':
        data = await this.getGoalSummary();
        break;
      case 'schedules':
        data = await this.getUpcomingSchedules();
        break;
      case 'reminders':
        data = await this.getUpcomingReminders();
        break;
      case 'notifications':
        data = { count: await this.getNotificationCount() };
        break;
      default:
        throw new Error(`Unknown dashboard section: ${section}`);
    }

    return {
      section,
      data,
      lastUpdated: Date.now(),
    };
  }

  /**
   * 强制刷新并通知渲染进程
   */
  async refresh(): Promise<DashboardOverview> {
    const overview = await this.getOverview(true);
    eventBus.emit('dashboard.updated', overview);
    return overview;
  }

  // ===== Private Section Loaders =====

  private async getTaskSummary(): Promise<DashboardOverview['taskSummary']> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = await this.taskService.getInstancesByDateRange(
        today.getTime(),
        tomorrow.getTime()
      );

      const instances = result.instances || [];
      const completed = instances.filter(i => i.status === 'completed').length;
      const pending = instances.filter(i => i.status === 'pending').length;
      const overdue = instances.filter(i => 
        i.status === 'pending' && i.dueTime && i.dueTime < Date.now()
      ).length;

      return {
        total: instances.length,
        completed,
        pending,
        overdue,
        completionRate: instances.length > 0 ? Math.round((completed / instances.length) * 100) : 0,
      };
    } catch (error) {
      logger.error('Failed to get task summary', error);
      return { total: 0, completed: 0, pending: 0, overdue: 0, completionRate: 0 };
    }
  }

  private async getGoalSummary(): Promise<DashboardOverview['goalSummary']> {
    try {
      const result = await this.goalService.listGoals({ status: 'active', limit: 5 });
      const goals = result.goals || [];

      return {
        total: result.total || 0,
        activeGoals: goals.map(g => ({
          uuid: g.uuid,
          title: g.title,
          progress: g.progress || 0,
          dueDate: g.targetDate,
        })),
      };
    } catch (error) {
      logger.error('Failed to get goal summary', error);
      return { total: 0, activeGoals: [] };
    }
  }

  private async getUpcomingSchedules(): Promise<DashboardOverview['upcomingSchedules']> {
    try {
      const now = Date.now();
      const endOfWeek = now + 7 * 24 * 60 * 60 * 1000;

      const result = await this.scheduleService.getEventsByDateRange(now, endOfWeek);
      const events = result.events || [];

      // 取最近的 5 个
      const sorted = events.sort((a, b) => a.startTime - b.startTime).slice(0, 5);

      return {
        count: events.length,
        items: sorted.map(e => ({
          uuid: e.uuid,
          title: e.title,
          startTime: e.startTime,
          endTime: e.endTime,
          type: e.type,
        })),
      };
    } catch (error) {
      logger.error('Failed to get upcoming schedules', error);
      return { count: 0, items: [] };
    }
  }

  private async getUpcomingReminders(): Promise<DashboardOverview['upcomingReminders']> {
    try {
      const result = await this.reminderService.listUpcoming({ limit: 5 });
      const reminders = result.reminders || [];

      return {
        count: result.total || 0,
        items: reminders.map(r => ({
          uuid: r.uuid,
          title: r.title,
          scheduledTime: r.scheduledTime,
        })),
      };
    } catch (error) {
      logger.error('Failed to get upcoming reminders', error);
      return { count: 0, items: [] };
    }
  }

  private async getNotificationCount(): Promise<number> {
    try {
      const result = await getNotificationAppService().listNotifications({ read: false });
      return result.unreadCount || 0;
    } catch (error) {
      logger.error('Failed to get notification count', error);
      return 0;
    }
  }

  // ===== Event Listeners =====

  private initEventListeners(): void {
    // 当任务完成时，使缓存失效
    eventBus.on('task.completed', () => {
      this.invalidateCache();
    });

    // 当目标更新时
    eventBus.on('goal.updated', () => {
      this.invalidateCache();
    });

    // 当提醒处理时
    eventBus.on('reminder.acknowledged', () => {
      this.invalidateCache();
    });
  }

  private invalidateCache(): void {
    this.cachedOverview = null;
    this.cacheExpiry = 0;
    logger.debug('Dashboard cache invalidated');
  }
}
```

### Task 7.2: 创建 Dashboard IPC Handlers

**文件**: `apps/desktop/src/main/modules/dashboard/ipc/dashboard.ipc-handlers.ts`

```typescript
/**
 * Dashboard IPC Handlers
 */

import { ipcMain } from 'electron';
import { DashboardDesktopApplicationService } from '../application/DashboardDesktopApplicationService';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('DashboardIPC');

let appService: DashboardDesktopApplicationService | null = null;

function getAppService(): DashboardDesktopApplicationService {
  if (!appService) {
    appService = new DashboardDesktopApplicationService();
  }
  return appService;
}

export function registerDashboardIpcHandlers(): void {
  // Get full overview
  ipcMain.handle('dashboard:get-overview', async (_, forceRefresh) => {
    try {
      return await getAppService().getOverview(forceRefresh);
    } catch (error) {
      logger.error('Failed to get dashboard overview', error);
      throw error;
    }
  });

  // Get specific section
  ipcMain.handle('dashboard:get-section', async (_, section) => {
    try {
      return await getAppService().getSection(section);
    } catch (error) {
      logger.error('Failed to get dashboard section', error);
      throw error;
    }
  });

  // Force refresh
  ipcMain.handle('dashboard:refresh', async () => {
    try {
      return await getAppService().refresh();
    } catch (error) {
      logger.error('Failed to refresh dashboard', error);
      throw error;
    }
  });

  logger.info('Dashboard IPC handlers registered');
}
```

### Task 7.3: 创建模块入口

**文件**: `apps/desktop/src/main/modules/dashboard/index.ts`

```typescript
/**
 * Dashboard Module - Desktop Main Process
 */

import { registerDashboardIpcHandlers } from './ipc/dashboard.ipc-handlers';
import { InitializationManager, InitializationPhase, createLogger } from '@dailyuse/utils';

const logger = createLogger('DashboardModule');

export function registerDashboardModule(): void {
  InitializationManager.getInstance().registerModule(
    'dashboard',
    InitializationPhase.FEATURE_MODULES, // 依赖 Core Services 完成
    async () => {
      registerDashboardIpcHandlers();
      logger.info('Dashboard module initialized');
    },
    ['goal', 'task', 'schedule', 'reminder', 'notification'] // 依赖这些模块
  );
}

export { DashboardDesktopApplicationService } from './application/DashboardDesktopApplicationService';
```

---

## 📚 技术上下文

### 缓存策略

- Dashboard 数据有 30 秒缓存
- 当关键事件发生（任务完成、目标更新）时缓存失效
- 用户可手动刷新强制更新

### 性能考虑

- 使用 Promise.all 并行加载各模块数据
- 提供 getSection 支持按需加载
- 限制返回列表数量（如最近 5 个）

---

## 🔗 依赖关系

- **依赖**: 
  - STORY-002 (Goal 模块)
  - STORY-003 (Task 模块)
  - STORY-004 (Schedule 模块)
  - STORY-005 (Reminder 模块)
  - STORY-006 (Notification 模块)
- **被依赖**: 无

---

## 📝 备注

- Dashboard 模块是纯聚合层，不应有自己的持久化
- 可考虑添加 Widget 配置功能（用户自定义显示哪些板块）
- 后续可添加数据可视化（图表）
