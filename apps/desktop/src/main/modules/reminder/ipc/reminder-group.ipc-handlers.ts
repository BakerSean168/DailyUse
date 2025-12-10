/**
 * Reminder Group IPC Handlers
 *
 * 使用 BaseIPCHandler 统一处理 IPC 请求
 * IPC 通道：提醒分组 CRUD
 */

import { ipcMain } from 'electron';
import { BaseIPCHandler } from '../../shared/application/base-ipc-handler';
import { ReminderDesktopApplicationService } from '../application/ReminderDesktopApplicationService';

export class ReminderGroupIPCHandler extends BaseIPCHandler {
  private reminderService: ReminderDesktopApplicationService;

  constructor() {
    super('ReminderGroupIPCHandler');
    this.reminderService = new ReminderDesktopApplicationService();
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // 创建提醒分组
    ipcMain.handle(
      'reminder:group:create',
      async (
        _,
        params: {
          accountUuid: string;
          name: string;
          description?: string;
          color?: string;
          icon?: string;
        },
      ) => {
        return this.handleRequest('reminder:group:create', () =>
          this.reminderService.createGroup(params),
        );
      },
    );

    // 获取单个提醒分组
    ipcMain.handle('reminder:group:get', async (_, uuid: string) => {
      return this.handleRequest('reminder:group:get', () =>
        this.reminderService.getGroup(uuid),
      );
    });

    // 列出提醒分组
    ipcMain.handle('reminder:group:list', async (_, accountUuid: string) => {
      return this.handleRequest('reminder:group:list', () =>
        this.reminderService.listGroups(accountUuid),
      );
    });

    // 更新提醒分组
    ipcMain.handle(
      'reminder:group:update',
      async (
        _,
        uuid: string,
        updates: { name?: string; description?: string; color?: string; icon?: string },
      ) => {
        return this.handleRequest('reminder:group:update', () =>
          this.reminderService.updateGroup(uuid, updates),
        );
      },
    );

    // 删除提醒分组
    ipcMain.handle('reminder:group:delete', async (_, uuid: string) => {
      return this.handleRequest('reminder:group:delete', () =>
        this.reminderService.deleteGroup(uuid),
      );
    });
  }
}

/**
 * 注册提醒分组 IPC 通道（已弃用）
 *
 * @deprecated 使用 ReminderGroupIPCHandler 类代替
 */
export function registerReminderGroupIpcHandlers(): void {
  const handler = new ReminderGroupIPCHandler();
  (global as any).reminderGroupIPCHandler = handler;
}

/**
 * 注销提醒分组 IPC 通道（已弃用）
 *
 * @deprecated 由应用生命周期管理自动处理
 */
export function unregisterReminderGroupIpcHandlers(): void {
  // IPC 通道由 Electron 在应用退出时自动清理
}
