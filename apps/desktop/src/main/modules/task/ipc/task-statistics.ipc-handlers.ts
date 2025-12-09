/**
 * Task Statistics IPC Handlers
 *
 * 处理 Task Statistics 相关的 IPC 通道
 */

import { ipcMain } from 'electron';
import { TaskDesktopApplicationService } from '../application/TaskDesktopApplicationService';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('TaskStatisticsIPC');

let appService: TaskDesktopApplicationService | null = null;

function getAppService(): TaskDesktopApplicationService {
  if (!appService) {
    appService = new TaskDesktopApplicationService();
  }
  return appService;
}

export function registerTaskStatisticsIpcHandlers(): void {
  ipcMain.handle('task-statistics:get-summary', async (_, params) => {
    try {
      return await getAppService().getStatisticsSummary(params?.accountUuid);
    } catch (error) {
      logger.error('Failed to get task statistics summary', error);
      throw error;
    }
  });

  ipcMain.handle('task-statistics:get-by-date-range', async (_, startDate, endDate) => {
    try {
      return await getAppService().getStatisticsByDateRange(startDate, endDate);
    } catch (error) {
      logger.error('Failed to get statistics by date range', error);
      throw error;
    }
  });

  ipcMain.handle('task-statistics:get-by-template', async (_, templateUuid) => {
    try {
      return await getAppService().getStatisticsByTemplate(templateUuid);
    } catch (error) {
      logger.error('Failed to get statistics by template', error);
      throw error;
    }
  });

  ipcMain.handle('task-statistics:get-productivity', async (_, date) => {
    try {
      return await getAppService().getProductivity(date);
    } catch (error) {
      logger.error('Failed to get productivity', error);
      throw error;
    }
  });

  ipcMain.handle('task-statistics:get-trends', async (_, days) => {
    try {
      return await getAppService().getTrends(days);
    } catch (error) {
      logger.error('Failed to get trends', error);
      throw error;
    }
  });

  ipcMain.handle('task-dashboard:get', async (_, accountUuid) => {
    try {
      return await getAppService().getDashboard(accountUuid || 'default');
    } catch (error) {
      logger.error('Failed to get task dashboard', error);
      throw error;
    }
  });

  logger.info('Task Statistics IPC handlers registered');
}
