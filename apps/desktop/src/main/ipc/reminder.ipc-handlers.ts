/**
 * Reminder Module IPC Handlers
 * 
 * Handles: ReminderTemplate, Upcoming reminders, ReminderGroup, ReminderStatistics
 */

import { ipcMain } from 'electron';

/**
 * 注册 Reminder 模块的 IPC 处理器
 */
export function registerReminderIpcHandlers(): void {
  // ============================================
  // Reminder Template Handlers
  // ============================================
  
  ipcMain.handle('reminder:template:create', async (_, request) => {
    return { uuid: 'todo', ...request };
  });

  ipcMain.handle('reminder:template:list', async (_, params) => {
    return { templates: [], total: 0, page: 1, pageSize: 20, hasMore: false };
  });

  ipcMain.handle('reminder:template:get', async (_, uuid) => {
    return null;
  });

  ipcMain.handle('reminder:template:update', async (_, uuid, request) => {
    return { uuid, ...request };
  });

  ipcMain.handle('reminder:template:delete', async (_, uuid) => {
    return { success: true };
  });

  ipcMain.handle('reminder:template:activate', async (_, uuid) => {
    return { success: true };
  });

  ipcMain.handle('reminder:template:deactivate', async (_, uuid) => {
    return { success: true };
  });

  // ============================================
  // Upcoming Reminder Handlers
  // ============================================

  ipcMain.handle('reminder:upcoming:list', async (_, params) => {
    return { reminders: [], total: 0, fromDate: Date.now(), toDate: Date.now() + 7 * 24 * 60 * 60 * 1000 };
  });

  ipcMain.handle('reminder:upcoming:get-next', async (_, count) => {
    return { reminders: [] };
  });

  ipcMain.handle('reminder:upcoming:dismiss', async (_, uuid) => {
    return { success: true };
  });

  ipcMain.handle('reminder:upcoming:snooze', async (_, uuid, duration) => {
    return { success: true, newTime: null };
  });

  ipcMain.handle('reminder:upcoming:acknowledge', async (_, uuid) => {
    return { success: true };
  });

  // ============================================
  // Reminder Group Handlers
  // ============================================

  ipcMain.handle('reminder:group:create', async (_, request) => {
    return { uuid: 'todo', ...request };
  });

  ipcMain.handle('reminder:group:list', async (_, params) => {
    return { groups: [], total: 0, page: 1, pageSize: 20, hasMore: false };
  });

  ipcMain.handle('reminder:group:get', async (_, uuid) => {
    return null;
  });

  ipcMain.handle('reminder:group:update', async (_, uuid, request) => {
    return { uuid, ...request };
  });

  ipcMain.handle('reminder:group:delete', async (_, uuid) => {
    return { success: true };
  });

  // ============================================
  // Reminder Statistics Handlers
  // ============================================

  ipcMain.handle('reminder:statistics:get-summary', async (_, params) => {
    return { total: 0, active: 0, completed: 0, snoozed: 0, dismissed: 0 };
  });

  ipcMain.handle('reminder:statistics:get-by-date-range', async (_, startDate, endDate) => {
    return { data: [] };
  });

  console.log('[IPC] Reminder handlers registered');
}
