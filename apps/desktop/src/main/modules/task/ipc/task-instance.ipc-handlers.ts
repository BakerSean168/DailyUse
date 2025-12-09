/**
 * Task Instance IPC Handlers
 *
 * 处理 Task Instance 相关的 IPC 通道
 */

import { ipcMain } from 'electron';
import { TaskDesktopApplicationService } from '../application/TaskDesktopApplicationService';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('TaskInstanceIPC');

let appService: TaskDesktopApplicationService | null = null;

function getAppService(): TaskDesktopApplicationService {
  if (!appService) {
    appService = new TaskDesktopApplicationService();
  }
  return appService;
}

export function registerTaskInstanceIpcHandlers(): void {
  ipcMain.handle('task-instance:list', async (_, params) => {
    try {
      return await getAppService().listInstances(params);
    } catch (error) {
      logger.error('Failed to list task instances', error);
      throw error;
    }
  });

  ipcMain.handle('task-instance:get', async (_, uuid) => {
    try {
      return await getAppService().getInstance(uuid);
    } catch (error) {
      logger.error('Failed to get task instance', error);
      throw error;
    }
  });

  ipcMain.handle('task-instance:delete', async (_, uuid) => {
    try {
      await getAppService().deleteInstance(uuid);
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete task instance', error);
      throw error;
    }
  });

  ipcMain.handle('task-instance:complete', async (_, uuid, completion) => {
    try {
      return await getAppService().completeInstance(uuid, completion);
    } catch (error) {
      logger.error('Failed to complete task instance', error);
      throw error;
    }
  });

  ipcMain.handle('task-instance:uncomplete', async (_, uuid) => {
    try {
      return await getAppService().uncompleteInstance(uuid);
    } catch (error) {
      logger.error('Failed to uncomplete task instance', error);
      throw error;
    }
  });

  ipcMain.handle('task-instance:reschedule', async (_, uuid, newDate) => {
    try {
      return await getAppService().rescheduleInstance(uuid, newDate);
    } catch (error) {
      logger.error('Failed to reschedule task instance', error);
      throw error;
    }
  });

  ipcMain.handle('task-instance:skip', async (_, uuid, reason) => {
    try {
      return await getAppService().skipInstance(uuid, reason);
    } catch (error) {
      logger.error('Failed to skip task instance', error);
      throw error;
    }
  });

  ipcMain.handle('task-instance:start', async (_, uuid) => {
    try {
      return await getAppService().startInstance(uuid);
    } catch (error) {
      logger.error('Failed to start task instance', error);
      throw error;
    }
  });

  ipcMain.handle('task-instance:pause', async (_, uuid) => {
    try {
      return await getAppService().pauseInstance(uuid);
    } catch (error) {
      logger.error('Failed to pause task instance', error);
      throw error;
    }
  });

  ipcMain.handle('task-instance:log-time', async (_, uuid, duration, note) => {
    try {
      return await getAppService().logTime(uuid, duration, note);
    } catch (error) {
      logger.error('Failed to log time', error);
      throw error;
    }
  });

  ipcMain.handle('task-instance:list-by-date', async (_, date) => {
    try {
      return await getAppService().listInstancesByDate(date);
    } catch (error) {
      logger.error('Failed to list instances by date', error);
      throw error;
    }
  });

  ipcMain.handle('task-instance:list-by-range', async (_, startDate, endDate) => {
    try {
      return await getAppService().listInstancesByDateRange(startDate, endDate);
    } catch (error) {
      logger.error('Failed to list instances by range', error);
      throw error;
    }
  });

  ipcMain.handle('task-instance:list-by-template', async (_, templateUuid) => {
    try {
      return await getAppService().listInstancesByTemplate(templateUuid);
    } catch (error) {
      logger.error('Failed to list instances by template', error);
      throw error;
    }
  });

  ipcMain.handle('task-instance:batch-update', async (_, updates) => {
    try {
      return await getAppService().batchUpdateInstances(updates);
    } catch (error) {
      logger.error('Failed to batch update task instances', error);
      throw error;
    }
  });

  ipcMain.handle('task-instance:batch-complete', async (_, uuids) => {
    try {
      return await getAppService().batchCompleteInstances(uuids);
    } catch (error) {
      logger.error('Failed to batch complete task instances', error);
      throw error;
    }
  });

  logger.info('Task Instance IPC handlers registered');
}
