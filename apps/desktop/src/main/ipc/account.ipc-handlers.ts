/**
 * Account Module IPC Handlers
 * 
 * Handles: Account CRUD, Profile, Subscription, Me
 */

import { ipcMain } from 'electron';

/**
 * 注册 Account 模块的 IPC 处理器
 */
export function registerAccountIpcHandlers(): void {
  // ============================================
  // Core Account Handlers
  // ============================================
  
  ipcMain.handle('account:create', async (_, request) => {
    return { uuid: 'todo', ...request };
  });

  ipcMain.handle('account:get', async (_, uuid) => {
    return null;
  });

  ipcMain.handle('account:update', async (_, uuid, request) => {
    return { uuid, ...request };
  });

  ipcMain.handle('account:delete', async (_, uuid) => {
    return { success: true };
  });

  // ============================================
  // Me (Current User) Handlers
  // ============================================

  ipcMain.handle('account:me:get', async () => {
    // Desktop offline mode - return local user
    return {
      uuid: 'local-user',
      email: 'local@desktop.app',
      name: 'Desktop User',
      createdAt: new Date().toISOString(),
    };
  });

  ipcMain.handle('account:me:update', async (_, request) => {
    return { success: true, ...request };
  });

  ipcMain.handle('account:me:change-password', async (_, oldPassword, newPassword) => {
    return { success: false, error: 'Desktop offline mode' };
  });

  ipcMain.handle('account:me:change-email', async (_, newEmail) => {
    return { success: false, error: 'Desktop offline mode' };
  });

  ipcMain.handle('account:me:verify-email', async (_, token) => {
    return { success: false, error: 'Desktop offline mode' };
  });

  ipcMain.handle('account:me:delete', async () => {
    return { success: false, error: 'Cannot delete local account' };
  });

  // ============================================
  // Profile Handlers
  // ============================================

  ipcMain.handle('account:profile:get', async (_, uuid) => {
    return null;
  });

  ipcMain.handle('account:profile:update', async (_, uuid, request) => {
    return { success: true, ...request };
  });

  ipcMain.handle('account:profile:upload-avatar', async (_, uuid, imageData) => {
    return { success: true, avatarUrl: null };
  });

  ipcMain.handle('account:profile:remove-avatar', async (_, uuid) => {
    return { success: true };
  });

  // ============================================
  // Subscription Handlers
  // ============================================

  ipcMain.handle('account:subscription:get', async () => {
    return {
      plan: 'desktop-free',
      status: 'active',
      features: ['offline-mode', 'local-storage'],
    };
  });

  ipcMain.handle('account:subscription:upgrade', async (_, planId) => {
    return { success: false, error: 'Desktop offline mode' };
  });

  ipcMain.handle('account:subscription:cancel', async () => {
    return { success: false, error: 'Desktop offline mode' };
  });

  ipcMain.handle('account:subscription:get-invoices', async () => {
    return { invoices: [], total: 0 };
  });

  ipcMain.handle('account:subscription:get-usage', async () => {
    return { storage: { used: 0, limit: -1 }, api: { used: 0, limit: -1 } };
  });

  console.log('[IPC] Account handlers registered');
}
