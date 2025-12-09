/**
 * Goal Statistics IPC Handlers
 */

import { ipcMain } from 'electron';
import { GoalDesktopApplicationService } from '../application/GoalDesktopApplicationService';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('GoalStatisticsIPC');

let appService: GoalDesktopApplicationService | null = null;

function getAppService(): GoalDesktopApplicationService {
  if (!appService) {
    appService = new GoalDesktopApplicationService();
  }
  return appService;
}

export function registerGoalStatisticsIpcHandlers(): void {
  ipcMain.handle('goal-statistics:get', async (_, accountUuid) => {
    try {
      return await getAppService().getStatistics(accountUuid || 'default');
    } catch (error) {
      logger.error('Failed to get goal statistics', error);
      throw error;
    }
  });

  logger.info('Goal Statistics IPC handlers registered');
}
