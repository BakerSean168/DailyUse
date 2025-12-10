/**
 * Reminder Statistics IPC Handlers
 *
 * 使用 BaseIPCHandler 统一处理 IPC 请求
 * IPC 通道：提醒统计信息
 */

import { ipcMain } from 'electron';
import { BaseIPCHandler } from '../../shared/application/base-ipc-handler';
import { ReminderDesktopApplicationService } from '../application/ReminderDesktopApplicationService';

export class ReminderStatisticsIPCHandler extends BaseIPCHandler {
  private reminderService: ReminderDesktopApplicationService;

  constructor() {
    super('ReminderStatisticsIPCHandler');
    this.reminderService = new ReminderDesktopApplicationService();
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // 获取统计摘要
    ipcMain.handle(
      'reminder:statistics:summary',
      async (_, accountUuid: string) => {
        return this.handleRequest('reminder:statistics:summary', () =>
          this.reminderService.getStatisticsSummary(accountUuid),
        );
      },
    );

    // 获取即将触发的提醒
    ipcMain.handle(
      'reminder:statistics:upcoming',
      async (_, days: number, accountUuid: string) => {
        return this.handleRequest('reminder:statistics:upcoming', () =>
          this.reminderService.getUpcoming(days || 7, accountUuid),
        );
      },
    );
  }
}

/**
 * 注册提醒统计 IPC 通道（已弃用）
 *
 * @deprecated 使用 ReminderStatisticsIPCHandler 类代替
 */
export function registerReminderStatisticsIpcHandlers(): void {
  const handler = new ReminderStatisticsIPCHandler();
  (global as any).reminderStatisticsIPCHandler = handler;
}

/**
 * 注销提醒统计 IPC 通道（已弃用）
 *
 * @deprecated 由应用生命周期管理自动处理
 */
export function unregisterReminderStatisticsIpcHandlers(): void {
  // IPC 通道由 Electron 在应用退出时自动清理
}
