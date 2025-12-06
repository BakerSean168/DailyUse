/**
 * Dashboard Module IPC Handlers
 */

import { ipcMain } from 'electron';

/**
 * 注册 Dashboard 模块的 IPC 处理器
 */
export function registerDashboardIpcHandlers(): void {
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
