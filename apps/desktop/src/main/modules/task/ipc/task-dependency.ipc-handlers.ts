/**
 * Task Dependency IPC Handlers
 *
 * 处理 Task Dependency 相关的 IPC 通道
 */

import { ipcMain } from 'electron';
import { TaskDesktopApplicationService } from '../application/TaskDesktopApplicationService';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('TaskDependencyIPC');

let appService: TaskDesktopApplicationService | null = null;

function getAppService(): TaskDesktopApplicationService {
  if (!appService) {
    appService = new TaskDesktopApplicationService();
  }
  return appService;
}

export function registerTaskDependencyIpcHandlers(): void {
  ipcMain.handle('task-dependency:create', async (_, request) => {
    try {
      return await getAppService().createDependency(request);
    } catch (error) {
      logger.error('Failed to create task dependency', error);
      throw error;
    }
  });

  ipcMain.handle('task-dependency:list', async (_, taskUuid) => {
    try {
      return await getAppService().listDependencies(taskUuid);
    } catch (error) {
      logger.error('Failed to list task dependencies', error);
      throw error;
    }
  });

  ipcMain.handle('task-dependency:delete', async (_, uuid) => {
    try {
      await getAppService().deleteDependency(uuid);
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete task dependency', error);
      throw error;
    }
  });

  ipcMain.handle('task-dependency:get-blocked', async (_, taskUuid) => {
    try {
      return await getAppService().getBlockedTasks(taskUuid);
    } catch (error) {
      logger.error('Failed to get blocked tasks', error);
      throw error;
    }
  });

  ipcMain.handle('task-dependency:get-blocking', async (_, taskUuid) => {
    try {
      return await getAppService().getBlockingTasks(taskUuid);
    } catch (error) {
      logger.error('Failed to get blocking tasks', error);
      throw error;
    }
  });

  ipcMain.handle('task-dependency:check-circular', async (_, fromUuid, toUuid) => {
    try {
      return await getAppService().checkCircularDependency(fromUuid, toUuid);
    } catch (error) {
      logger.error('Failed to check circular dependency', error);
      throw error;
    }
  });

  logger.info('Task Dependency IPC handlers registered');
}
