/**
 * Schedule Task IPC Handlers
 *
 * IPC 通道：调度任务 CRUD 和生命周期管理
 */

import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import { ScheduleDesktopApplicationService } from '../application/ScheduleDesktopApplicationService';
import type { CreateScheduleTaskInput } from '@dailyuse/application-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ScheduleTaskIPC');

// 单例实例
let scheduleService: ScheduleDesktopApplicationService | null = null;

const getService = (): ScheduleDesktopApplicationService => {
  if (!scheduleService) {
    scheduleService = new ScheduleDesktopApplicationService();
  }
  return scheduleService;
};

/**
 * 注册调度任务 IPC 通道
 *
 * Channels:
 * - schedule:task:create - 创建调度任务
 * - schedule:task:get - 获取单个调度任务
 * - schedule:task:list - 列出调度任务
 * - schedule:task:update - 更新调度任务
 * - schedule:task:delete - 删除调度任务
 * - schedule:task:pause - 暂停任务
 * - schedule:task:resume - 恢复任务
 * - schedule:task:reschedule - 重新调度任务
 * - schedule:task:batchReschedule - 批量重新调度
 */
export function registerScheduleTaskIpcHandlers(): void {
  logger.info('Registering schedule task IPC handlers');

  // 创建调度任务
  ipcMain.handle(
    'schedule:task:create',
    async (_event: IpcMainInvokeEvent, input: CreateScheduleTaskInput) => {
      logger.debug('IPC: schedule:task:create', { name: input.name });
      try {
        const task = await getService().createTask(input);
        return { success: true, task };
      } catch (error) {
        logger.error('Failed to create schedule task', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  // 获取单个调度任务
  ipcMain.handle('schedule:task:get', async (_event: IpcMainInvokeEvent, uuid: string) => {
    logger.debug('IPC: schedule:task:get', { uuid });
    try {
      const task = await getService().getTask(uuid);
      return { success: true, task };
    } catch (error) {
      logger.error('Failed to get schedule task', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // 列出调度任务
  ipcMain.handle(
    'schedule:task:list',
    async (
      _event: IpcMainInvokeEvent,
      params?: { accountUuid?: string; sourceModule?: string; sourceEntityId?: string },
    ) => {
      logger.debug('IPC: schedule:task:list', params);
      try {
        const result = await getService().listTasks(params as any);
        return { success: true, ...result };
      } catch (error) {
        logger.error('Failed to list schedule tasks', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  // 按源实体列出任务
  ipcMain.handle(
    'schedule:task:listBySourceEntity',
    async (
      _event: IpcMainInvokeEvent,
      sourceModule: string,
      sourceEntityId: string,
    ) => {
      logger.debug('IPC: schedule:task:listBySourceEntity', { sourceModule, sourceEntityId });
      try {
        const result = await getService().listTasksBySourceEntity(sourceModule, sourceEntityId);
        return { success: true, ...result };
      } catch (error) {
        logger.error('Failed to list schedule tasks by source entity', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  // 更新调度任务
  ipcMain.handle(
    'schedule:task:update',
    async (
      _event: IpcMainInvokeEvent,
      uuid: string,
      updates: { description?: string; schedule?: { cronExpression?: string } },
    ) => {
      logger.debug('IPC: schedule:task:update', { uuid });
      try {
        const task = await getService().updateTask(uuid, updates);
        return { success: true, task };
      } catch (error) {
        logger.error('Failed to update schedule task', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  // 删除调度任务
  ipcMain.handle('schedule:task:delete', async (_event: IpcMainInvokeEvent, uuid: string) => {
    logger.debug('IPC: schedule:task:delete', { uuid });
    try {
      await getService().deleteTask(uuid);
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete schedule task', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // 暂停任务
  ipcMain.handle('schedule:task:pause', async (_event: IpcMainInvokeEvent, uuid: string) => {
    logger.debug('IPC: schedule:task:pause', { uuid });
    try {
      const result = await getService().pauseTask(uuid);
      return { success: result.success };
    } catch (error) {
      logger.error('Failed to pause schedule task', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // 恢复任务
  ipcMain.handle('schedule:task:resume', async (_event: IpcMainInvokeEvent, uuid: string) => {
    logger.debug('IPC: schedule:task:resume', { uuid });
    try {
      const result = await getService().resumeTask(uuid);
      return { success: result.success };
    } catch (error) {
      logger.error('Failed to resume schedule task', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // 重新调度任务
  ipcMain.handle(
    'schedule:task:reschedule',
    async (
      _event: IpcMainInvokeEvent,
      uuid: string,
      newSchedule: { cronExpression?: string },
    ) => {
      logger.debug('IPC: schedule:task:reschedule', { uuid });
      try {
        const task = await getService().rescheduleTask(uuid, newSchedule);
        return { success: true, task };
      } catch (error) {
        logger.error('Failed to reschedule task', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  // 批量重新调度
  ipcMain.handle(
    'schedule:task:batchReschedule',
    async (
      _event: IpcMainInvokeEvent,
      tasks: Array<{ uuid: string; cronExpression: string }>,
    ) => {
      logger.debug('IPC: schedule:task:batchReschedule', { count: tasks.length });
      try {
        const result = await getService().batchReschedule(tasks);
        return { success: result.success, count: result.count };
      } catch (error) {
        logger.error('Failed to batch reschedule tasks', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  // 查找到期任务
  ipcMain.handle(
    'schedule:task:findDue',
    async (_event: IpcMainInvokeEvent, params?: { beforeTime?: number }) => {
      logger.debug('IPC: schedule:task:findDue', params);
      try {
        const result = await getService().findDueTasks({
          beforeTime: params?.beforeTime ? new Date(params.beforeTime) : undefined,
        });
        return { success: true, ...result };
      } catch (error) {
        logger.error('Failed to find due tasks', error);
        return { success: false, error: (error as Error).message };
      }
    },
  );

  logger.info('Schedule task IPC handlers registered (10 channels)');
}

/**
 * 注销调度任务 IPC 通道
 */
export function unregisterScheduleTaskIpcHandlers(): void {
  logger.info('Unregistering schedule task IPC handlers');
  ipcMain.removeHandler('schedule:task:create');
  ipcMain.removeHandler('schedule:task:get');
  ipcMain.removeHandler('schedule:task:list');
  ipcMain.removeHandler('schedule:task:listBySourceEntity');
  ipcMain.removeHandler('schedule:task:update');
  ipcMain.removeHandler('schedule:task:delete');
  ipcMain.removeHandler('schedule:task:pause');
  ipcMain.removeHandler('schedule:task:resume');
  ipcMain.removeHandler('schedule:task:reschedule');
  ipcMain.removeHandler('schedule:task:batchReschedule');
  ipcMain.removeHandler('schedule:task:findDue');
}
