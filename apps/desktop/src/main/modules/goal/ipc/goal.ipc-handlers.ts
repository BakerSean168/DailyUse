/**
 * Goal IPC Handlers
 *
 * 处理 Goal 模块的主要 IPC 通道
 */

import { ipcMain } from 'electron';
import { GoalDesktopApplicationService } from '../application/GoalDesktopApplicationService';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('GoalIPC');

let appService: GoalDesktopApplicationService | null = null;

function getAppService(): GoalDesktopApplicationService {
  if (!appService) {
    appService = new GoalDesktopApplicationService();
  }
  return appService;
}

export function registerGoalIpcHandlers(): void {
  // ===== Goal CRUD =====

  ipcMain.handle('goal:create', async (_, request) => {
    try {
      return await getAppService().createGoal(request);
    } catch (error) {
      logger.error('Failed to create goal', error);
      throw error;
    }
  });

  ipcMain.handle('goal:list', async (_, params) => {
    try {
      return await getAppService().listGoals(params || {});
    } catch (error) {
      logger.error('Failed to list goals', error);
      throw error;
    }
  });

  ipcMain.handle('goal:get', async (_, uuid, includeChildren = true) => {
    try {
      return await getAppService().getGoal(uuid, includeChildren);
    } catch (error) {
      logger.error('Failed to get goal', error);
      throw error;
    }
  });

  ipcMain.handle('goal:update', async (_, uuid, request) => {
    try {
      return await getAppService().updateGoal(uuid, request);
    } catch (error) {
      logger.error('Failed to update goal', error);
      throw error;
    }
  });

  ipcMain.handle('goal:delete', async (_, uuid) => {
    try {
      await getAppService().deleteGoal(uuid);
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete goal', error);
      throw error;
    }
  });

  // ===== Goal Status =====

  ipcMain.handle('goal:activate', async (_, uuid) => {
    try {
      return await getAppService().activateGoal(uuid);
    } catch (error) {
      logger.error('Failed to activate goal', error);
      throw error;
    }
  });

  ipcMain.handle('goal:complete', async (_, uuid) => {
    try {
      return await getAppService().completeGoal(uuid);
    } catch (error) {
      logger.error('Failed to complete goal', error);
      throw error;
    }
  });

  ipcMain.handle('goal:archive', async (_, uuid) => {
    try {
      return await getAppService().archiveGoal(uuid);
    } catch (error) {
      logger.error('Failed to archive goal', error);
      throw error;
    }
  });

  logger.info('Goal IPC handlers registered');
}
