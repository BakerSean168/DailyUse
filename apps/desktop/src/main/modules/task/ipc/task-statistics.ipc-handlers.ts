/**
 * Task Statistics IPC Handlers
 * 
 * 使用 BaseIPCHandler 统一处理 IPC 请求
 * 提供一致的错误处理、日志记录和响应格式
 */

import { ipcMain } from 'electron';
import { BaseIPCHandler } from '../../shared/application/base-ipc-handler';
import { TaskDesktopApplicationService } from '../application/TaskDesktopApplicationService';

export class TaskStatisticsIPCHandler extends BaseIPCHandler {
  private taskService: TaskDesktopApplicationService;

  constructor() {
    super('TaskStatisticsIPCHandler');
    this.taskService = new TaskDesktopApplicationService();
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // 获取任务统计摘要
    ipcMain.handle('task-statistics:get-summary', async (_, params) => {
      return this.handleRequest(
        'task-statistics:get-summary',
        async () => {
          // TODO: 实现 getStatisticsSummary 方法
          return null;
        },
        { accountUuid: params?.accountUuid },
      );
    });

    // 按日期范围获取统计
    ipcMain.handle('task-statistics:get-by-date-range', async (_, payload: { startDate: number; endDate: number }) => {
      return this.handleRequest(
        'task-statistics:get-by-date-range',
        async () => {
          // TODO: 实现 getStatisticsByDateRange 方法
          return null;
        },
      );
    });

    // 按模板获取统计
    ipcMain.handle('task-statistics:get-by-template', async (_, templateUuid) => {
      return this.handleRequest(
        'task-statistics:get-by-template',
        async () => {
          // TODO: 实现 getStatisticsByTemplate 方法
          return null;
        },
      );
    });

    // 获取生产力统计
    ipcMain.handle('task-statistics:get-productivity', async (_, date) => {
      return this.handleRequest(
        'task-statistics:get-productivity',
        async () => {
          // TODO: 实现 getProductivity 方法
          return null;
        },
      );
    });

    // 获取趋势
    ipcMain.handle('task-statistics:get-trends', async (_, days) => {
      return this.handleRequest(
        'task-statistics:get-trends',
        async () => {
          // TODO: 实现 getTrends 方法
          return null;
        },
      );
    });

    // 获取任务仪表板
    ipcMain.handle('task-dashboard:get', async (_, accountUuid) => {
      return this.handleRequest(
        'task-dashboard:get',
        () => this.taskService.getDashboard(accountUuid || 'default'),
        { accountUuid },
      );
    });

    this.logger.info('Registered Task Statistics IPC handlers');
  }
}

export const taskStatisticsIPCHandler = new TaskStatisticsIPCHandler();

/**
 * @deprecated 使用 TaskStatisticsIPCHandler 类代替
 * 此文件保留用于向后兼容，所有功能已迁移到 TaskStatisticsIPCHandler 类
 */
export function registerTaskStatisticsIpcHandlers(): void {
  // 处理器已在 TaskStatisticsIPCHandler 构造时自动注册
}
