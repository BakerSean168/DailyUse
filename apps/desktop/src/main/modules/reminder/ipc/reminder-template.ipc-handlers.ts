/**
 * Reminder Template IPC Handlers
 *
 * IPC 通道：提醒模板 CRUD 和状态管理
 */

import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import { ReminderDesktopApplicationService } from '../application/ReminderDesktopApplicationService';
import type { CreateReminderTemplateInput, ListReminderTemplatesInput } from '@dailyuse/application-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ReminderTemplateIPC');

// 单例实例
let reminderService: ReminderDesktopApplicationService | null = null;

const getService = (): ReminderDesktopApplicationService => {
  if (!reminderService) {
    reminderService = new ReminderDesktopApplicationService();
  }
  return reminderService;
};

/**
 * 注册提醒模板 IPC 通道
 *
 * Channels:
 * - reminder:template:create - 创建提醒模板
 * - reminder:template:get - 获取单个提醒模板
 * - reminder:template:list - 列出提醒模板
 * - reminder:template:update - 更新提醒模板
 * - reminder:template:delete - 删除提醒模板
 * - reminder:template:enable - 启用模板
 * - reminder:template:disable - 禁用模板
 * - reminder:template:listByGroup - 按分组列出模板
 * - reminder:template:listActive - 列出活跃模板
 */
export function registerReminderTemplateIpcHandlers(): void {
  logger.info('Registering reminder template IPC handlers');

  // 创建提醒模板
  ipcMain.handle(
    'reminder:template:create',
    async (_event: IpcMainInvokeEvent, input: CreateReminderTemplateInput) => {
      logger.debug('IPC: reminder:template:create', { title: input.title });
      try {
        const template = await getService().createTemplate(input);
        return { success: true, template };
      } catch (error) {
        logger.error('Failed to create reminder template', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  // 获取单个提醒模板
  ipcMain.handle('reminder:template:get', async (_event: IpcMainInvokeEvent, uuid: string) => {
    logger.debug('IPC: reminder:template:get', { uuid });
    try {
      const template = await getService().getTemplate(uuid);
      return { success: true, template };
    } catch (error) {
      logger.error('Failed to get reminder template', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // 列出提醒模板
  ipcMain.handle(
    'reminder:template:list',
    async (_event: IpcMainInvokeEvent, params: ListReminderTemplatesInput) => {
      logger.debug('IPC: reminder:template:list', params);
      try {
        const result = await getService().listTemplates(params);
        return { success: true, ...result };
      } catch (error) {
        logger.error('Failed to list reminder templates', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  // 更新提醒模板
  ipcMain.handle(
    'reminder:template:update',
    async (
      _event: IpcMainInvokeEvent,
      uuid: string,
      accountUuid: string,
      updates: { title?: string; description?: string },
    ) => {
      logger.debug('IPC: reminder:template:update', { uuid });
      try {
        const template = await getService().updateTemplate(uuid, accountUuid, updates);
        return { success: true, template };
      } catch (error) {
        logger.error('Failed to update reminder template', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  // 删除提醒模板
  ipcMain.handle(
    'reminder:template:delete',
    async (_event: IpcMainInvokeEvent, uuid: string, accountUuid: string) => {
      logger.debug('IPC: reminder:template:delete', { uuid });
      try {
        await getService().deleteTemplate(uuid, accountUuid);
        return { success: true };
      } catch (error) {
        logger.error('Failed to delete reminder template', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  // 启用模板
  ipcMain.handle('reminder:template:enable', async (_event: IpcMainInvokeEvent, uuid: string) => {
    logger.debug('IPC: reminder:template:enable', { uuid });
    try {
      const template = await getService().enableTemplate(uuid);
      return { success: true, template };
    } catch (error) {
      logger.error('Failed to enable reminder template', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // 禁用模板
  ipcMain.handle('reminder:template:disable', async (_event: IpcMainInvokeEvent, uuid: string) => {
    logger.debug('IPC: reminder:template:disable', { uuid });
    try {
      const template = await getService().disableTemplate(uuid);
      return { success: true, template };
    } catch (error) {
      logger.error('Failed to disable reminder template', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // 按分组列出模板
  ipcMain.handle(
    'reminder:template:listByGroup',
    async (_event: IpcMainInvokeEvent, groupUuid: string, accountUuid: string) => {
      logger.debug('IPC: reminder:template:listByGroup', { groupUuid, accountUuid });
      try {
        const result = await getService().listTemplatesByGroup(groupUuid, accountUuid);
        return { success: true, ...result };
      } catch (error) {
        logger.error('Failed to list reminder templates by group', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  // 列出活跃模板
  ipcMain.handle(
    'reminder:template:listActive',
    async (_event: IpcMainInvokeEvent, accountUuid: string) => {
      logger.debug('IPC: reminder:template:listActive', { accountUuid });
      try {
        const result = await getService().listActiveTemplates(accountUuid);
        return { success: true, ...result };
      } catch (error) {
        logger.error('Failed to list active reminder templates', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  logger.info('Reminder template IPC handlers registered (9 channels)');
}

/**
 * 注销提醒模板 IPC 通道
 */
export function unregisterReminderTemplateIpcHandlers(): void {
  logger.info('Unregistering reminder template IPC handlers');
  ipcMain.removeHandler('reminder:template:create');
  ipcMain.removeHandler('reminder:template:get');
  ipcMain.removeHandler('reminder:template:list');
  ipcMain.removeHandler('reminder:template:update');
  ipcMain.removeHandler('reminder:template:delete');
  ipcMain.removeHandler('reminder:template:enable');
  ipcMain.removeHandler('reminder:template:disable');
  ipcMain.removeHandler('reminder:template:listByGroup');
  ipcMain.removeHandler('reminder:template:listActive');
}
