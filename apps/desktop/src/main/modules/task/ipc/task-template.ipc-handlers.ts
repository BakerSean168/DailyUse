/**
 * Task Template IPC Handlers
 *
 * 处理 Task Template 相关的 IPC 通道
 */

import { ipcMain } from 'electron';
import { TaskDesktopApplicationService } from '../application/TaskDesktopApplicationService';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('TaskTemplateIPC');

let appService: TaskDesktopApplicationService | null = null;

function getAppService(): TaskDesktopApplicationService {
  if (!appService) {
    appService = new TaskDesktopApplicationService();
  }
  return appService;
}

export function registerTaskTemplateIpcHandlers(): void {
  ipcMain.handle('task-template:create', async (_, request) => {
    try {
      return await getAppService().createTemplate(request);
    } catch (error) {
      logger.error('Failed to create task template', error);
      throw error;
    }
  });

  ipcMain.handle('task-template:create-one-time', async (_, request) => {
    try {
      return await getAppService().createOneTimeTask(request);
    } catch (error) {
      logger.error('Failed to create one-time task', error);
      throw error;
    }
  });

  ipcMain.handle('task-template:list', async (_, params) => {
    try {
      const result = await getAppService().listTemplates(params);
      return result.templates;
    } catch (error) {
      logger.error('Failed to list task templates', error);
      throw error;
    }
  });

  ipcMain.handle('task-template:get', async (_, uuid) => {
    try {
      return await getAppService().getTemplate(uuid);
    } catch (error) {
      logger.error('Failed to get task template', error);
      throw error;
    }
  });

  ipcMain.handle('task-template:update', async (_, uuid, request) => {
    try {
      return await getAppService().updateTemplate(uuid, request);
    } catch (error) {
      logger.error('Failed to update task template', error);
      throw error;
    }
  });

  ipcMain.handle('task-template:delete', async (_, uuid) => {
    try {
      await getAppService().deleteTemplate(uuid);
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete task template', error);
      throw error;
    }
  });

  ipcMain.handle('task-template:activate', async (_, uuid) => {
    try {
      return await getAppService().activateTemplate(uuid);
    } catch (error) {
      logger.error('Failed to activate task template', error);
      throw error;
    }
  });

  ipcMain.handle('task-template:pause', async (_, uuid) => {
    try {
      return await getAppService().pauseTemplate(uuid);
    } catch (error) {
      logger.error('Failed to pause task template', error);
      throw error;
    }
  });

  ipcMain.handle('task-template:archive', async (_, uuid) => {
    try {
      return await getAppService().archiveTemplate(uuid);
    } catch (error) {
      logger.error('Failed to archive task template', error);
      throw error;
    }
  });

  ipcMain.handle('task-template:restore', async (_, uuid) => {
    try {
      return await getAppService().restoreTemplate(uuid);
    } catch (error) {
      logger.error('Failed to restore task template', error);
      throw error;
    }
  });

  ipcMain.handle('task-template:duplicate', async (_, uuid) => {
    try {
      return await getAppService().duplicateTemplate(uuid);
    } catch (error) {
      logger.error('Failed to duplicate task template', error);
      throw error;
    }
  });

  ipcMain.handle('task-template:search', async (_, query, params) => {
    try {
      return await getAppService().searchTemplates(query, params?.limit);
    } catch (error) {
      logger.error('Failed to search task templates', error);
      throw error;
    }
  });

  ipcMain.handle('task-template:batch-update', async (_, updates) => {
    try {
      return await getAppService().batchUpdateTemplates(updates);
    } catch (error) {
      logger.error('Failed to batch update task templates', error);
      throw error;
    }
  });

  logger.info('Task Template IPC handlers registered');
}
