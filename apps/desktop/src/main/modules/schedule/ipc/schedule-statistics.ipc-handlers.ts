/**
 * Schedule Statistics IPC Handlers
 *
 * IPC 通道：调度统计信息
 */

import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import { ScheduleDesktopApplicationService } from '../application/ScheduleDesktopApplicationService';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ScheduleStatisticsIPC');

// 单例实例
let scheduleService: ScheduleDesktopApplicationService | null = null;

const getService = (): ScheduleDesktopApplicationService => {
  if (!scheduleService) {
    scheduleService = new ScheduleDesktopApplicationService();
  }
  return scheduleService;
};

/**
 * 注册调度统计 IPC 通道
 *
 * Channels:
 * - schedule:statistics:summary - 获取统计摘要
 * - schedule:statistics:byDateRange - 按日期范围获取统计
 * - schedule:statistics:upcoming - 获取即将执行的任务
 */
export function registerScheduleStatisticsIpcHandlers(): void {
  logger.info('Registering schedule statistics IPC handlers');

  // 获取统计摘要
  ipcMain.handle(
    'schedule:statistics:summary',
    async (_event: IpcMainInvokeEvent, accountUuid?: string) => {
      logger.debug('IPC: schedule:statistics:summary', { accountUuid });
      try {
        const summary = await getService().getStatisticsSummary(accountUuid);
        return { success: true, ...summary };
      } catch (error) {
        logger.error('Failed to get schedule statistics summary', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  // 按日期范围获取统计
  ipcMain.handle(
    'schedule:statistics:byDateRange',
    async (
      _event: IpcMainInvokeEvent,
      startDate: number,
      endDate: number,
      accountUuid?: string,
    ) => {
      logger.debug('IPC: schedule:statistics:byDateRange', { startDate, endDate, accountUuid });
      try {
        const result = await getService().getStatisticsByDateRange(startDate, endDate, accountUuid);
        return { success: true, ...result };
      } catch (error) {
        logger.error('Failed to get schedule statistics by date range', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  // 获取即将执行的任务
  ipcMain.handle(
    'schedule:statistics:upcoming',
    async (_event: IpcMainInvokeEvent, days?: number, accountUuid?: string) => {
      logger.debug('IPC: schedule:statistics:upcoming', { days, accountUuid });
      try {
        const result = await getService().getUpcoming(days || 7, accountUuid);
        return { success: true, ...result };
      } catch (error) {
        logger.error('Failed to get upcoming schedule tasks', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  logger.info('Schedule statistics IPC handlers registered (3 channels)');
}

/**
 * 注销调度统计 IPC 通道
 */
export function unregisterScheduleStatisticsIpcHandlers(): void {
  logger.info('Unregistering schedule statistics IPC handlers');
  ipcMain.removeHandler('schedule:statistics:summary');
  ipcMain.removeHandler('schedule:statistics:byDateRange');
  ipcMain.removeHandler('schedule:statistics:upcoming');
}
