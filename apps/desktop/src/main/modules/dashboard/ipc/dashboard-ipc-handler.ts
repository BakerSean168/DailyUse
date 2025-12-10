/**
 * Dashboard IPC 处理器
 * 处理所有与仪表板相关的 IPC 请求
 */

import { ipcMain } from 'electron';
import { BaseIPCHandler } from '../../shared/application/base-ipc-handler';
import { DashboardDesktopApplicationService } from '../application/DashboardDesktopApplicationService';

export class DashboardIPCHandler extends BaseIPCHandler {
  private dashboardService: DashboardDesktopApplicationService;

  constructor() {
    super('DashboardIPCHandler');
    this.dashboardService = new DashboardDesktopApplicationService();
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // 获取统计数据
    ipcMain.handle('dashboard:get-statistics', async (event, accountUuid: string) => {
      return this.handleRequest(
        'dashboard:get-statistics',
        () => this.dashboardService.getStatistics(accountUuid),
        { accountUuid },
      );
    });

    // 失效缓存
    ipcMain.handle('dashboard:invalidate-cache', async (event, accountUuid: string) => {
      return this.handleRequest(
        'dashboard:invalidate-cache',
        () => this.dashboardService.invalidateCache(accountUuid),
        { accountUuid },
      );
    });

    // 获取 Widget 配置
    ipcMain.handle('dashboard:get-widget-config', async (event, accountUuid: string) => {
      return this.handleRequest(
        'dashboard:get-widget-config',
        () => this.dashboardService.getWidgetConfig(accountUuid),
        { accountUuid },
      );
    });

    // 更新 Widget 配置
    ipcMain.handle('dashboard:update-widget-config', async (event, payload: { accountUuid: string; configs: any }) => {
      return this.handleRequest(
        'dashboard:update-widget-config',
        () => this.dashboardService.updateWidgetConfig(payload.accountUuid, payload.configs),
        { accountUuid: payload.accountUuid },
      );
    });

    // 重置 Widget 配置
    ipcMain.handle('dashboard:reset-widget-config', async (event, accountUuid: string) => {
      return this.handleRequest(
        'dashboard:reset-widget-config',
        () => this.dashboardService.resetWidgetConfig(accountUuid),
        { accountUuid },
      );
    });

    // 获取概览数据
    ipcMain.handle('dashboard:get-overview', async (event, accountUuid: string) => {
      return this.handleRequest(
        'dashboard:get-overview',
        () => this.dashboardService.getOverview(accountUuid),
        { accountUuid },
      );
    });

    // 获取所有数据
    ipcMain.handle('dashboard:get-all-data', async (event, accountUuid: string) => {
      return this.handleRequest(
        'dashboard:get-all-data',
        () => this.dashboardService.getAllData(accountUuid),
        { accountUuid },
      );
    });

    // 获取今日数据
    ipcMain.handle('dashboard:get-today', async (event, accountUuid: string) => {
      return this.handleRequest(
        'dashboard:get-today',
        () => this.dashboardService.getToday(accountUuid),
        { accountUuid },
      );
    });

    // 获取统计数据（按时间段）
    ipcMain.handle('dashboard:get-stats', async (event, payload: { accountUuid: string; period: 'day' | 'week' | 'month' }) => {
      return this.handleRequest(
        'dashboard:get-stats',
        () => this.dashboardService.getStats(payload.accountUuid, payload.period),
        { accountUuid: payload.accountUuid },
      );
    });

    this.logger.info('Registered Dashboard IPC handlers');
  }
}

export const dashboardIPCHandler = new DashboardIPCHandler();
