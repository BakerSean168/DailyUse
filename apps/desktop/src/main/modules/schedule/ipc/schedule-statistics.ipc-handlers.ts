/**
 * Schedule Statistics IPC Handlers
 *
 * 使用 BaseIPCHandler 统一处理 IPC 请求
 * IPC 通道：调度统计信息
 */

import { ipcMain } from 'electron';
import { BaseIPCHandler } from '../../shared/application/base-ipc-handler';
import { ScheduleDesktopApplicationService } from '../application/ScheduleDesktopApplicationService';

export class ScheduleStatisticsIPCHandler extends BaseIPCHandler {
  private scheduleService: ScheduleDesktopApplicationService;

  constructor() {
    super('ScheduleStatisticsIPCHandler');
    this.scheduleService = new ScheduleDesktopApplicationService();
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // 获取统计摘要
    ipcMain.handle(
      'schedule:statistics:summary',
      async (_, accountUuid?: string) => {
        return this.handleRequest(
          'schedule:statistics:summary',
          () => this.scheduleService.getStatisticsSummary(accountUuid),
        );
      },
    );

    // 按日期范围获取统计
    ipcMain.handle(
      'schedule:statistics:byDateRange',
      async (_, startDate: number, endDate: number, accountUuid?: string) => {
        return this.handleRequest(
          'schedule:statistics:byDateRange',
          () => this.scheduleService.getStatisticsByDateRange(startDate, endDate, accountUuid),
        );
      },
    );

    // 获取即将执行的任务
    ipcMain.handle(
      'schedule:statistics:upcoming',
      async (_, days?: number, accountUuid?: string) => {
        return this.handleRequest(
          'schedule:statistics:upcoming',
          () => this.scheduleService.getUpcoming(days || 7, accountUuid),
        );
      },
    );
  }
}

/**
 * 注册调度统计 IPC 通道（已弃用）
 *
 * @deprecated 使用 ScheduleStatisticsIPCHandler 类代替
 */
export function registerScheduleStatisticsIpcHandlers(): void {
  const handler = new ScheduleStatisticsIPCHandler();
  (global as any).scheduleStatisticsIPCHandler = handler;
}

/**
 * 注销调度统计 IPC 通道（已弃用）
 *
 * @deprecated 由应用生命周期管理自动处理
 */
export function unregisterScheduleStatisticsIpcHandlers(): void {
  // IPC 通道由 Electron 在应用退出时自动清理
}
