/**
 * Dashboard Module IPC Handlers
 *
 * 使用 BaseIPCHandler 统一处理 IPC 请求
 * 提供仪表盘数据的批量获取，减少 IPC 调用次数
 * 复用 DashboardDesktopApplicationService 中的逻辑
 */

import { ipcMain } from 'electron';
import { BaseIPCHandler } from '../../shared/application/base-ipc-handler';

import {
  DashboardDesktopApplicationService,
  type DashboardAllData,
} from '../application/DashboardDesktopApplicationService';

export class DashboardIPCHandler extends BaseIPCHandler {
  private appService: DashboardDesktopApplicationService;

  constructor() {
    super('DashboardIPCHandler');
    this.appService = new DashboardDesktopApplicationService();
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // ===== Batch Operations =====

    /**
     * 批量获取仪表盘所有数据
     * 合并多个 IPC 调用为单次调用，减少 IPC 开销
     */
    ipcMain.handle('dashboard:get-all', async (_, accountUuid?: string) => {
      return this.handleRequest('dashboard:get-all', () =>
        this.appService.getAllData(accountUuid || 'default'),
      );
    });

    // ===== Overview =====

    ipcMain.handle('dashboard:get-overview', async (_, accountUuid?: string) => {
      return this.handleRequest('dashboard:get-overview', () =>
        this.appService.getOverview(accountUuid || 'default'),
      );
    });

    ipcMain.handle('dashboard:get-today', async (_, accountUuid?: string) => {
      return this.handleRequest('dashboard:get-today', () =>
        this.appService.getToday(accountUuid || 'default'),
      );
    });

    ipcMain.handle(
      'dashboard:get-stats',
      async (_, accountUuid?: string, period?: 'day' | 'week' | 'month') => {
        return this.handleRequest('dashboard:get-stats', () =>
          this.appService.getStats(accountUuid || 'default', period || 'day'),
        );
      },
    );

    ipcMain.handle(
      'dashboard:get-recent-activity',
      async (_, accountUuid?: string, limit?: number) => {
        return this.handleRequest('dashboard:get-recent-activity', () =>
          this.appService.getRecentActivity(accountUuid || 'default', limit || 10),
        );
      },
    );

    // ===== Widget Configuration =====

    ipcMain.handle('dashboard:get-widgets', async (_, accountUuid?: string) => {
      return this.handleRequest('dashboard:get-widgets', () =>
        this.appService.getWidgetConfig(accountUuid || 'default'),
      );
    });

    ipcMain.handle(
      'dashboard:update-widgets',
      async (_, accountUuid: string | undefined, widgets: any) => {
        return this.handleRequest('dashboard:update-widgets', () => {
          // Handle legacy signature: (widgets) or new signature: (accountUuid, widgets)
          const actualAccountUuid =
            typeof accountUuid === 'string' && widgets ? accountUuid : 'default';
          const actualWidgets = widgets || accountUuid;
          return this.appService.updateWidgetConfig(actualAccountUuid, actualWidgets);
        });
      },
    );

    ipcMain.handle('dashboard:reset-widgets', async (_, accountUuid?: string) => {
      return this.handleRequest('dashboard:reset-widgets', () =>
        this.appService.resetWidgetConfig(accountUuid || 'default'),
      );
    });

    // ===== Statistics =====

    ipcMain.handle('dashboard:get-statistics', async (_, accountUuid?: string) => {
      return this.handleRequest('dashboard:get-statistics', () =>
        this.appService.getStatistics(accountUuid || 'default'),
      );
    });

    ipcMain.handle('dashboard:invalidate-cache', async (_, accountUuid?: string) => {
      return this.handleRequest('dashboard:invalidate-cache', () =>
        this.appService.invalidateCache(accountUuid || 'default'),
      );
    });
  }
}

/**
 * 注册 Dashboard 模块的 IPC 处理器（已弃用）
 *
 * @deprecated 使用 DashboardIPCHandler 类代替
 */
export function registerDashboardIpcHandlers(): void {
  const handler = new DashboardIPCHandler();
  (global as any).dashboardIPCHandler = handler;
}

/**
 * 注销 Dashboard 模块的 IPC 处理器（已弃用）
 *
 * @deprecated 由应用生命周期管理自动处理
 */
export function unregisterDashboardIpcHandlers(): void {
  // IPC 通道由 Electron 在应用退出时自动清理
}
