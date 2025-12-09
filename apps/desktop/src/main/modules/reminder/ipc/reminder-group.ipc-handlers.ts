/**
 * Reminder Group IPC Handlers
 *
 * IPC 通道：提醒分组 CRUD
 */

import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import { ReminderDesktopApplicationService } from '../application/ReminderDesktopApplicationService';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ReminderGroupIPC');

// 单例实例
let reminderService: ReminderDesktopApplicationService | null = null;

const getService = (): ReminderDesktopApplicationService => {
  if (!reminderService) {
    reminderService = new ReminderDesktopApplicationService();
  }
  return reminderService;
};

/**
 * 注册提醒分组 IPC 通道
 *
 * Channels:
 * - reminder:group:create - 创建提醒分组
 * - reminder:group:get - 获取单个提醒分组
 * - reminder:group:list - 列出提醒分组
 * - reminder:group:update - 更新提醒分组
 * - reminder:group:delete - 删除提醒分组
 */
export function registerReminderGroupIpcHandlers(): void {
  logger.info('Registering reminder group IPC handlers');

  // 创建提醒分组
  ipcMain.handle(
    'reminder:group:create',
    async (
      _event: IpcMainInvokeEvent,
      params: {
        accountUuid: string;
        name: string;
        description?: string;
        color?: string;
        icon?: string;
      },
    ) => {
      logger.debug('IPC: reminder:group:create', { name: params.name });
      try {
        const group = await getService().createGroup(params);
        return { success: true, group };
      } catch (error) {
        logger.error('Failed to create reminder group', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  // 获取单个提醒分组
  ipcMain.handle('reminder:group:get', async (_event: IpcMainInvokeEvent, uuid: string) => {
    logger.debug('IPC: reminder:group:get', { uuid });
    try {
      const group = await getService().getGroup(uuid);
      return { success: true, group };
    } catch (error) {
      logger.error('Failed to get reminder group', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // 列出提醒分组
  ipcMain.handle(
    'reminder:group:list',
    async (_event: IpcMainInvokeEvent, accountUuid: string) => {
      logger.debug('IPC: reminder:group:list', { accountUuid });
      try {
        const result = await getService().listGroups(accountUuid);
        return { success: true, ...result };
      } catch (error) {
        logger.error('Failed to list reminder groups', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  // 更新提醒分组
  ipcMain.handle(
    'reminder:group:update',
    async (
      _event: IpcMainInvokeEvent,
      uuid: string,
      updates: { name?: string; description?: string; color?: string; icon?: string },
    ) => {
      logger.debug('IPC: reminder:group:update', { uuid });
      try {
        const group = await getService().updateGroup(uuid, updates);
        return { success: true, group };
      } catch (error) {
        logger.error('Failed to update reminder group', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  // 删除提醒分组
  ipcMain.handle('reminder:group:delete', async (_event: IpcMainInvokeEvent, uuid: string) => {
    logger.debug('IPC: reminder:group:delete', { uuid });
    try {
      await getService().deleteGroup(uuid);
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete reminder group', error);
      return { success: false, error: (error as Error).message };
    }
  });

  logger.info('Reminder group IPC handlers registered (5 channels)');
}

/**
 * 注销提醒分组 IPC 通道
 */
export function unregisterReminderGroupIpcHandlers(): void {
  logger.info('Unregistering reminder group IPC handlers');
  ipcMain.removeHandler('reminder:group:create');
  ipcMain.removeHandler('reminder:group:get');
  ipcMain.removeHandler('reminder:group:list');
  ipcMain.removeHandler('reminder:group:update');
  ipcMain.removeHandler('reminder:group:delete');
}
