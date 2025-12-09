/**
 * Reminder Statistics IPC Handlers
 *
 * IPC 通道：提醒统计信息
 */

import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import { ReminderDesktopApplicationService } from '../application/ReminderDesktopApplicationService';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ReminderStatisticsIPC');

// 单例实例
let reminderService: ReminderDesktopApplicationService | null = null;

const getService = (): ReminderDesktopApplicationService => {
  if (!reminderService) {
    reminderService = new ReminderDesktopApplicationService();
  }
  return reminderService;
};

/**
 * 注册提醒统计 IPC 通道
 *
 * Channels:
 * - reminder:statistics:summary - 获取统计摘要
 * - reminder:statistics:upcoming - 获取即将触发的提醒
 */
export function registerReminderStatisticsIpcHandlers(): void {
  logger.info('Registering reminder statistics IPC handlers');

  // 获取统计摘要
  ipcMain.handle(
    'reminder:statistics:summary',
    async (_event: IpcMainInvokeEvent, accountUuid: string) => {
      logger.debug('IPC: reminder:statistics:summary', { accountUuid });
      try {
        const statistics = await getService().getStatisticsSummary(accountUuid);
        return { success: true, statistics };
      } catch (error) {
        logger.error('Failed to get reminder statistics summary', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  // 获取即将触发的提醒
  ipcMain.handle(
    'reminder:statistics:upcoming',
    async (_event: IpcMainInvokeEvent, days: number, accountUuid: string) => {
      logger.debug('IPC: reminder:statistics:upcoming', { days, accountUuid });
      try {
        const result = await getService().getUpcoming(days || 7, accountUuid);
        return { success: true, ...result };
      } catch (error) {
        logger.error('Failed to get upcoming reminders', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  logger.info('Reminder statistics IPC handlers registered (2 channels)');
}

/**
 * 注销提醒统计 IPC 通道
 */
export function unregisterReminderStatisticsIpcHandlers(): void {
  logger.info('Unregistering reminder statistics IPC handlers');
  ipcMain.removeHandler('reminder:statistics:summary');
  ipcMain.removeHandler('reminder:statistics:upcoming');
}
