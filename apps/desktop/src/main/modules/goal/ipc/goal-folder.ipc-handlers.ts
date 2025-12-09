/**
 * Goal Folder IPC Handlers
 */

import { ipcMain } from 'electron';
import { GoalDesktopApplicationService } from '../application/GoalDesktopApplicationService';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('GoalFolderIPC');

let appService: GoalDesktopApplicationService | null = null;

function getAppService(): GoalDesktopApplicationService {
  if (!appService) {
    appService = new GoalDesktopApplicationService();
  }
  return appService;
}

export function registerGoalFolderIpcHandlers(): void {
  ipcMain.handle('goal-folder:create', async (_, request) => {
    try {
      return await getAppService().createFolder(request);
    } catch (error) {
      logger.error('Failed to create goal folder', error);
      throw error;
    }
  });

  ipcMain.handle('goal-folder:list', async (_, accountUuid) => {
    try {
      return await getAppService().listFolders(accountUuid || 'default');
    } catch (error) {
      logger.error('Failed to list goal folders', error);
      throw error;
    }
  });

  ipcMain.handle('goal-folder:update', async (_, uuid, request) => {
    try {
      return await getAppService().updateFolder(uuid, request);
    } catch (error) {
      logger.error('Failed to update goal folder', error);
      throw error;
    }
  });

  ipcMain.handle('goal-folder:delete', async (_, uuid) => {
    try {
      await getAppService().deleteFolder(uuid);
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete goal folder', error);
      throw error;
    }
  });

  logger.info('Goal Folder IPC handlers registered');
}
