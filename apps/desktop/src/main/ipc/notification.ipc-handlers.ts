/**
 * Notification Module IPC Handlers
 */

import { ipcMain, Notification } from 'electron';

/**
 * 注册 Notification 模块的 IPC 处理器
 */
export function registerNotificationIpcHandlers(): void {
  ipcMain.handle('notification:show', async (_, options) => {
    const notification = new Notification({
      title: options.title || 'DailyUse',
      body: options.body || '',
      icon: options.icon,
      silent: options.silent ?? false,
    });
    notification.show();
    return { success: true };
  });

  ipcMain.handle('notification:list', async (_, params) => {
    return { notifications: [], total: 0 };
  });

  ipcMain.handle('notification:get', async (_, uuid) => {
    return null;
  });

  ipcMain.handle('notification:mark-read', async (_, uuid) => {
    return { success: true };
  });

  ipcMain.handle('notification:mark-all-read', async () => {
    return { success: true, count: 0 };
  });

  ipcMain.handle('notification:delete', async (_, uuid) => {
    return { success: true };
  });

  ipcMain.handle('notification:get-unread-count', async () => {
    return { count: 0 };
  });

  ipcMain.handle('notification:get-preferences', async () => {
    return {
      enabled: true,
      sound: true,
      desktop: true,
      email: false,
      types: {},
    };
  });

  ipcMain.handle('notification:update-preferences', async (_, preferences) => {
    return { success: true, ...preferences };
  });

  console.log('[IPC] Notification handlers registered');
}
