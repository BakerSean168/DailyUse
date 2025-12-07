/**
 * Dashboard Module IPC Handlers
 *
 * 提供仪表盘数据的批量获取，减少 IPC 调用次数
 */

import { ipcMain } from 'electron';
import { getMainContainer } from '../di';

// ============ Types ============

interface DashboardStats {
  goals: {
    total: number;
    active: number;
    completed: number;
    paused: number;
    overdue: number;
  };
  tasks: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
  schedules: {
    total: number;
    active: number;
    paused: number;
    todayCount: number;
  };
  reminders: {
    total: number;
    enabled: number;
    todayCount: number;
  };
}

interface DashboardAllData {
  stats: DashboardStats;
  activeGoals: unknown[];
  todayTasks: unknown[];
  todaySchedules: unknown[];
  upcomingReminders: unknown[];
  timestamp: number;
}

// ============ Helper Functions ============

async function loadGoalStats(): Promise<{
  stats: DashboardStats['goals'];
  activeGoals: unknown[];
}> {
  try {
    const container = getMainContainer();
    const goalService = container.resolve('goalService');
    const goals = await goalService.getGoals({});

    const stats = {
      total: goals.goals.length,
      active: goals.goals.filter((g: any) => g.status === 'ACTIVE').length,
      completed: goals.goals.filter((g: any) => g.status === 'COMPLETED').length,
      paused: goals.goals.filter((g: any) => g.status === 'PAUSED').length,
      overdue: goals.goals.filter(
        (g: any) => g.deadline && new Date(g.deadline) < new Date() && g.status === 'ACTIVE'
      ).length,
    };

    const activeGoals = goals.goals
      .filter((g: any) => g.status === 'ACTIVE')
      .slice(0, 5);

    return { stats, activeGoals };
  } catch (error) {
    console.warn('[Dashboard] Failed to load goal stats:', error);
    return {
      stats: { total: 0, active: 0, completed: 0, paused: 0, overdue: 0 },
      activeGoals: [],
    };
  }
}

async function loadTaskStats(): Promise<{
  stats: DashboardStats['tasks'];
  todayTasks: unknown[];
}> {
  try {
    const container = getMainContainer();
    const taskTemplateService = container.resolve('taskTemplateService');
    const templates = await taskTemplateService.getTaskTemplates();

    const stats = {
      total: templates.length,
      pending: templates.filter((t: any) => t.status === 'ACTIVE').length,
      inProgress: templates.filter((t: any) => t.status === 'IN_PROGRESS').length,
      completed: templates.filter((t: any) => t.status === 'COMPLETED').length,
    };

    const todayTasks = templates.filter((t: any) => t.status === 'ACTIVE').slice(0, 10);

    return { stats, todayTasks };
  } catch (error) {
    console.warn('[Dashboard] Failed to load task stats:', error);
    return {
      stats: { total: 0, pending: 0, inProgress: 0, completed: 0 },
      todayTasks: [],
    };
  }
}

async function loadScheduleStats(): Promise<{
  stats: DashboardStats['schedules'];
  todaySchedules: unknown[];
}> {
  try {
    const container = getMainContainer();
    const scheduleService = container.resolve('scheduleTaskService');
    const schedules = await scheduleService.getScheduleTasks({});

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCount = schedules.filter((s: any) => {
      const scheduledAt = new Date(s.scheduledAt);
      return scheduledAt >= today && scheduledAt < tomorrow;
    }).length;

    const stats = {
      total: schedules.length,
      active: schedules.filter((s: any) => s.status === 'ACTIVE' || s.status === 'PENDING').length,
      paused: schedules.filter((s: any) => s.status === 'PAUSED').length,
      todayCount,
    };

    const todaySchedules = schedules
      .filter((s: any) => {
        const scheduledAt = new Date(s.scheduledAt);
        return scheduledAt >= today && scheduledAt < tomorrow;
      })
      .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .slice(0, 10);

    return { stats, todaySchedules };
  } catch (error) {
    console.warn('[Dashboard] Failed to load schedule stats:', error);
    return {
      stats: { total: 0, active: 0, paused: 0, todayCount: 0 },
      todaySchedules: [],
    };
  }
}

async function loadReminderStats(): Promise<{
  stats: DashboardStats['reminders'];
  upcomingReminders: unknown[];
}> {
  try {
    const container = getMainContainer();
    const reminderService = container.resolve('reminderTemplateService');
    const response = await reminderService.getReminderTemplates({});
    const reminders = response.templates;

    const stats = {
      total: reminders.length,
      enabled: reminders.filter((r: any) => r.effectiveEnabled).length,
      todayCount: reminders.filter((r: any) => r.nextTriggerAt != null).length,
    };

    const upcomingReminders = reminders
      .filter((r: any) => r.effectiveEnabled && r.nextTriggerAt != null)
      .sort((a: any, b: any) => (a.nextTriggerAt || 0) - (b.nextTriggerAt || 0))
      .slice(0, 5);

    return { stats, upcomingReminders };
  } catch (error) {
    console.warn('[Dashboard] Failed to load reminder stats:', error);
    return {
      stats: { total: 0, enabled: 0, todayCount: 0 },
      upcomingReminders: [],
    };
  }
}

// ============ IPC Handlers ============

/**
 * 注册 Dashboard 模块的 IPC 处理器
 */
export function registerDashboardIpcHandlers(): void {
  /**
   * 批量获取仪表盘所有数据
   * 合并多个 IPC 调用为单次调用，减少 IPC 开销
   */
  ipcMain.handle('dashboard:get-all', async (): Promise<DashboardAllData> => {
    const startTime = performance.now();

    // 并行加载所有数据
    const [goalsResult, tasksResult, schedulesResult, remindersResult] =
      await Promise.all([
        loadGoalStats(),
        loadTaskStats(),
        loadScheduleStats(),
        loadReminderStats(),
      ]);

    const result: DashboardAllData = {
      stats: {
        goals: goalsResult.stats,
        tasks: tasksResult.stats,
        schedules: schedulesResult.stats,
        reminders: remindersResult.stats,
      },
      activeGoals: goalsResult.activeGoals,
      todayTasks: tasksResult.todayTasks,
      todaySchedules: schedulesResult.todaySchedules,
      upcomingReminders: remindersResult.upcomingReminders,
      timestamp: Date.now(),
    };

    const duration = performance.now() - startTime;
    console.log(`[Dashboard] Batch load completed in ${duration.toFixed(2)}ms`);

    return result;
  });

  // ============ 单独的数据获取（向后兼容） ============

  ipcMain.handle('dashboard:get-overview', async () => {
    return {
      goals: { total: 0, active: 0, completed: 0 },
      tasks: { total: 0, completed: 0, pending: 0, overdue: 0 },
      schedule: { todayEvents: 0, upcomingEvents: 0 },
      reminders: { active: 0, snoozed: 0 },
    };
  });

  ipcMain.handle('dashboard:get-today', async () => {
    return {
      date: new Date().toISOString().split('T')[0],
      tasks: [],
      events: [],
      reminders: [],
      goals: [],
    };
  });

  ipcMain.handle('dashboard:get-stats', async (_, period) => {
    return {
      period,
      productivity: 0,
      tasksCompleted: 0,
      goalsProgress: 0,
      timeTracked: 0,
    };
  });

  ipcMain.handle('dashboard:get-recent-activity', async (_, limit) => {
    return { activities: [], total: 0 };
  });

  ipcMain.handle('dashboard:get-widgets', async () => {
    return { widgets: [] };
  });

  ipcMain.handle('dashboard:update-widgets', async (_, widgets) => {
    return { success: true, widgets };
  });

  console.log('[IPC] Dashboard handlers registered');
}
