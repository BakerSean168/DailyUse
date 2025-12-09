/**
 * Notification IPC Handlers
 *
 * IPC 通道：通知 CRUD 和状态管理
 */

import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import { NotificationDesktopApplicationService } from '../application/NotificationDesktopApplicationService';
import type { CreateNotificationInput } from '@dailyuse/application-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('NotificationIPC');

// 单例实例
let notificationService: NotificationDesktopApplicationService | null = null;

const getService = (): NotificationDesktopApplicationService => {
  if (!notificationService) {
    notificationService = new NotificationDesktopApplicationService();
  }
  return notificationService;
};

/**
 * 注册通知 IPC 通道
 *
 * Channels:
 * - notification:create - 创建通知
 * - notification:get - 获取单个通知
 * - notification:list - 列出通知
 * - notification:listUnread - 列出未读通知
 * - notification:getUnreadCount - 获取未读数量
 * - notification:markAsRead - 标记为已读
 * - notification:markAllAsRead - 标记全部已读
 * - notification:delete - 删除通知
 * - notification:preference:get - 获取偏好设置
 * - notification:preference:getOrCreate - 获取或创建偏好设置
 * - notification:preference:update - 更新偏好设置
 * - notification:statistics:summary - 获取统计摘要
 */
export function registerNotificationIpcHandlers(): void {
  logger.info('Registering notification IPC handlers');

  // 创建通知
  ipcMain.handle(
    'notification:create',
    async (_event: IpcMainInvokeEvent, input: CreateNotificationInput) => {
      logger.debug('IPC: notification:create', { title: input.title });
      try {
        const notification = await getService().create(input);
        return { success: true, notification };
      } catch (error) {
        logger.error('Failed to create notification', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  // 获取单个通知
  ipcMain.handle(
    'notification:get',
    async (_event: IpcMainInvokeEvent, uuid: string, includeChildren?: boolean) => {
      logger.debug('IPC: notification:get', { uuid });
      try {
        const notification = await getService().get(uuid, includeChildren);
        return { success: true, notification };
      } catch (error) {
        logger.error('Failed to get notification', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  // 列出通知
  ipcMain.handle(
    'notification:list',
    async (
      _event: IpcMainInvokeEvent,
      accountUuid: string,
      options?: { includeRead?: boolean; limit?: number; offset?: number },
    ) => {
      logger.debug('IPC: notification:list', { accountUuid, options });
      try {
        const notifications = await getService().list(accountUuid, options);
        return { success: true, notifications, total: notifications.length };
      } catch (error) {
        logger.error('Failed to list notifications', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  // 列出未读通知
  ipcMain.handle(
    'notification:listUnread',
    async (_event: IpcMainInvokeEvent, accountUuid: string, limit?: number) => {
      logger.debug('IPC: notification:listUnread', { accountUuid, limit });
      try {
        const notifications = await getService().listUnread(accountUuid, limit);
        return { success: true, notifications, total: notifications.length };
      } catch (error) {
        logger.error('Failed to list unread notifications', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  // 获取未读数量
  ipcMain.handle(
    'notification:getUnreadCount',
    async (_event: IpcMainInvokeEvent, accountUuid: string) => {
      logger.debug('IPC: notification:getUnreadCount', { accountUuid });
      try {
        const count = await getService().getUnreadCount(accountUuid);
        return { success: true, count };
      } catch (error) {
        logger.error('Failed to get unread count', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  // 标记为已读
  ipcMain.handle('notification:markAsRead', async (_event: IpcMainInvokeEvent, uuid: string) => {
    logger.debug('IPC: notification:markAsRead', { uuid });
    try {
      await getService().markAsRead(uuid);
      return { success: true };
    } catch (error) {
      logger.error('Failed to mark notification as read', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // 标记全部已读
  ipcMain.handle(
    'notification:markAllAsRead',
    async (_event: IpcMainInvokeEvent, accountUuid: string) => {
      logger.debug('IPC: notification:markAllAsRead', { accountUuid });
      try {
        await getService().markAllAsRead(accountUuid);
        return { success: true };
      } catch (error) {
        logger.error('Failed to mark all notifications as read', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  // 删除通知
  ipcMain.handle(
    'notification:delete',
    async (_event: IpcMainInvokeEvent, uuid: string, soft?: boolean) => {
      logger.debug('IPC: notification:delete', { uuid, soft });
      try {
        await getService().delete(uuid, soft ?? true);
        return { success: true };
      } catch (error) {
        logger.error('Failed to delete notification', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  // 获取偏好设置
  ipcMain.handle(
    'notification:preference:get',
    async (_event: IpcMainInvokeEvent, accountUuid: string) => {
      logger.debug('IPC: notification:preference:get', { accountUuid });
      try {
        const preference = await getService().getPreference(accountUuid);
        return { success: true, preference };
      } catch (error) {
        logger.error('Failed to get notification preference', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  // 获取或创建偏好设置
  ipcMain.handle(
    'notification:preference:getOrCreate',
    async (_event: IpcMainInvokeEvent, accountUuid: string) => {
      logger.debug('IPC: notification:preference:getOrCreate', { accountUuid });
      try {
        const preference = await getService().getOrCreatePreference(accountUuid);
        return { success: true, preference };
      } catch (error) {
        logger.error('Failed to get or create notification preference', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  // 更新偏好设置
  ipcMain.handle(
    'notification:preference:update',
    async (_event: IpcMainInvokeEvent, accountUuid: string, updates: any) => {
      logger.debug('IPC: notification:preference:update', { accountUuid });
      try {
        const preference = await getService().updatePreference(accountUuid, updates);
        return { success: true, preference };
      } catch (error) {
        logger.error('Failed to update notification preference', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  // 获取统计摘要
  ipcMain.handle(
    'notification:statistics:summary',
    async (_event: IpcMainInvokeEvent, accountUuid: string) => {
      logger.debug('IPC: notification:statistics:summary', { accountUuid });
      try {
        const summary = await getService().getStatisticsSummary(accountUuid);
        return { success: true, ...summary };
      } catch (error) {
        logger.error('Failed to get notification statistics summary', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  logger.info('Notification IPC handlers registered (12 channels)');
}

/**
 * 注销通知 IPC 通道
 */
export function unregisterNotificationIpcHandlers(): void {
  logger.info('Unregistering notification IPC handlers');
  ipcMain.removeHandler('notification:create');
  ipcMain.removeHandler('notification:get');
  ipcMain.removeHandler('notification:list');
  ipcMain.removeHandler('notification:listUnread');
  ipcMain.removeHandler('notification:getUnreadCount');
  ipcMain.removeHandler('notification:markAsRead');
  ipcMain.removeHandler('notification:markAllAsRead');
  ipcMain.removeHandler('notification:delete');
  ipcMain.removeHandler('notification:preference:get');
  ipcMain.removeHandler('notification:preference:getOrCreate');
  ipcMain.removeHandler('notification:preference:update');
  ipcMain.removeHandler('notification:statistics:summary');
}
