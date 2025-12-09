/**
 * Account Module IPC Handlers
 *
 * Account 模块 IPC 处理器
 * 复用 AccountDesktopApplicationService 中的逻辑
 */

import { ipcMain } from 'electron';
import { createLogger } from '@dailyuse/utils';

import { AccountDesktopApplicationService } from '../application/AccountDesktopApplicationService';

const logger = createLogger('AccountIpcHandlers');

// 惰性初始化的服务实例
let appService: AccountDesktopApplicationService | null = null;

function getAppService(): AccountDesktopApplicationService {
  if (!appService) {
    appService = new AccountDesktopApplicationService();
  }
  return appService;
}

// 所有 IPC channel 名称
const IPC_CHANNELS = [
  // Core Account
  'account:create',
  'account:get',
  'account:update',
  'account:delete',
  // Me (Current User)
  'account:me:get',
  'account:me:update',
  'account:me:change-password',
  'account:me:change-email',
  'account:me:verify-email',
  'account:me:delete',
  // Profile
  'account:profile:get',
  'account:profile:update',
  'account:profile:upload-avatar',
  'account:profile:remove-avatar',
  // Subscription
  'account:subscription:get',
  'account:subscription:upgrade',
  'account:subscription:cancel',
  'account:subscription:get-invoices',
  'account:subscription:get-usage',
] as const;

/**
 * 注册 Account 模块的 IPC 处理器
 */
export function registerAccountIpcHandlers(): void {
  logger.info('Registering Account IPC handlers...');

  // ============================================
  // Core Account Handlers
  // ============================================

  ipcMain.handle('account:create', async (_, request: { email: string; password: string; username?: string }) => {
    try {
      return await getAppService().createAccount(request);
    } catch (error) {
      logger.error('Failed to create account', error);
      throw error;
    }
  });

  ipcMain.handle('account:get', async (_, uuid: string) => {
    try {
      return await getAppService().getAccount(uuid);
    } catch (error) {
      logger.error('Failed to get account', error);
      return null;
    }
  });

  ipcMain.handle('account:update', async (_, uuid: string, request: { name?: string; email?: string }) => {
    try {
      return await getAppService().updateAccount(uuid, request);
    } catch (error) {
      logger.error('Failed to update account', error);
      throw error;
    }
  });

  ipcMain.handle('account:delete', async (_, uuid: string) => {
    try {
      return await getAppService().deleteAccount(uuid);
    } catch (error) {
      logger.error('Failed to delete account', error);
      throw error;
    }
  });

  // ============================================
  // Me (Current User) Handlers
  // ============================================

  ipcMain.handle('account:me:get', async () => {
    try {
      return await getAppService().getCurrentUser();
    } catch (error) {
      logger.error('Failed to get current user', error);
      throw error;
    }
  });

  ipcMain.handle('account:me:update', async (_, request: { name?: string; email?: string }) => {
    try {
      return await getAppService().updateCurrentUser(request);
    } catch (error) {
      logger.error('Failed to update current user', error);
      throw error;
    }
  });

  ipcMain.handle('account:me:change-password', async (_, oldPassword: string, newPassword: string) => {
    try {
      return await getAppService().changePassword(oldPassword, newPassword);
    } catch (error) {
      logger.error('Failed to change password', error);
      throw error;
    }
  });

  ipcMain.handle('account:me:change-email', async (_, newEmail: string) => {
    try {
      return await getAppService().changeEmail(newEmail);
    } catch (error) {
      logger.error('Failed to change email', error);
      throw error;
    }
  });

  ipcMain.handle('account:me:verify-email', async (_, token: string) => {
    try {
      return await getAppService().verifyEmail(token);
    } catch (error) {
      logger.error('Failed to verify email', error);
      throw error;
    }
  });

  ipcMain.handle('account:me:delete', async () => {
    try {
      return await getAppService().deleteCurrentUser();
    } catch (error) {
      logger.error('Failed to delete current user', error);
      throw error;
    }
  });

  // ============================================
  // Profile Handlers
  // ============================================

  ipcMain.handle('account:profile:get', async (_, uuid: string) => {
    try {
      return await getAppService().getProfile(uuid);
    } catch (error) {
      logger.error('Failed to get profile', error);
      return null;
    }
  });

  ipcMain.handle('account:profile:update', async (_, uuid: string, request: any) => {
    try {
      return await getAppService().updateProfile(uuid, request);
    } catch (error) {
      logger.error('Failed to update profile', error);
      throw error;
    }
  });

  ipcMain.handle('account:profile:upload-avatar', async (_, uuid: string, imageData: string) => {
    try {
      return await getAppService().uploadAvatar(uuid, imageData);
    } catch (error) {
      logger.error('Failed to upload avatar', error);
      throw error;
    }
  });

  ipcMain.handle('account:profile:remove-avatar', async (_, uuid: string) => {
    try {
      return await getAppService().removeAvatar(uuid);
    } catch (error) {
      logger.error('Failed to remove avatar', error);
      throw error;
    }
  });

  // ============================================
  // Subscription Handlers
  // ============================================

  ipcMain.handle('account:subscription:get', async () => {
    try {
      return await getAppService().getSubscription();
    } catch (error) {
      logger.error('Failed to get subscription', error);
      throw error;
    }
  });

  ipcMain.handle('account:subscription:upgrade', async (_, planId: string) => {
    try {
      return await getAppService().upgradeSubscription(planId);
    } catch (error) {
      logger.error('Failed to upgrade subscription', error);
      throw error;
    }
  });

  ipcMain.handle('account:subscription:cancel', async () => {
    try {
      return await getAppService().cancelSubscription();
    } catch (error) {
      logger.error('Failed to cancel subscription', error);
      throw error;
    }
  });

  ipcMain.handle('account:subscription:get-invoices', async () => {
    try {
      return await getAppService().getInvoices();
    } catch (error) {
      logger.error('Failed to get invoices', error);
      throw error;
    }
  });

  ipcMain.handle('account:subscription:get-usage', async () => {
    try {
      return await getAppService().getUsage();
    } catch (error) {
      logger.error('Failed to get usage', error);
      throw error;
    }
  });

  logger.info(`Account IPC handlers registered (${IPC_CHANNELS.length} channels)`);
}

/**
 * 注销 Account 模块的 IPC 处理器
 */
export function unregisterAccountIpcHandlers(): void {
  logger.info('Unregistering Account IPC handlers...');

  for (const channel of IPC_CHANNELS) {
    ipcMain.removeHandler(channel);
  }

  // Reset service instance
  appService = null;

  logger.info('Account IPC handlers unregistered');
}
