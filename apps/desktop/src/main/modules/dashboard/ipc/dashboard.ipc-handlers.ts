/**
 * Dashboard Module IPC Handlers
 *
 * 提供仪表盘数据的批量获取，减少 IPC 调用次数
 * 复用 DashboardDesktopApplicationService 中的逻辑
 */

import { ipcMain } from 'electron';
import { createLogger } from '@dailyuse/utils';

import {
  DashboardDesktopApplicationService,
  type DashboardAllData,
} from '../application/DashboardDesktopApplicationService';

const logger = createLogger('DashboardIpcHandlers');

// 惰性初始化的服务实例
let appService: DashboardDesktopApplicationService | null = null;

function getAppService(): DashboardDesktopApplicationService {
  if (!appService) {
    appService = new DashboardDesktopApplicationService();
  }
  return appService;
}

// 所有 IPC channel 名称
const IPC_CHANNELS = [
  // Batch operations
  'dashboard:get-all',
  // Overview
  'dashboard:get-overview',
  'dashboard:get-today',
  'dashboard:get-stats',
  'dashboard:get-recent-activity',
  // Widget configuration
  'dashboard:get-widgets',
  'dashboard:update-widgets',
  'dashboard:reset-widgets',
  // Statistics
  'dashboard:get-statistics',
  'dashboard:invalidate-cache',
] as const;

/**
 * 注册 Dashboard 模块的 IPC 处理器
 */
export function registerDashboardIpcHandlers(): void {
  logger.info('Registering Dashboard IPC handlers...');

  // ===== Batch Operations =====

  /**
   * 批量获取仪表盘所有数据
   * 合并多个 IPC 调用为单次调用，减少 IPC 开销
   */
  ipcMain.handle('dashboard:get-all', async (_, accountUuid?: string): Promise<DashboardAllData> => {
    try {
      return await getAppService().getAllData(accountUuid || 'default');
    } catch (error) {
      logger.error('Failed to get all dashboard data', error);
      throw error;
    }
  });

  // ===== Overview =====

  ipcMain.handle('dashboard:get-overview', async (_, accountUuid?: string) => {
    try {
      return await getAppService().getOverview(accountUuid || 'default');
    } catch (error) {
      logger.error('Failed to get dashboard overview', error);
      throw error;
    }
  });

  ipcMain.handle('dashboard:get-today', async (_, accountUuid?: string) => {
    try {
      return await getAppService().getToday(accountUuid || 'default');
    } catch (error) {
      logger.error('Failed to get today data', error);
      throw error;
    }
  });

  ipcMain.handle('dashboard:get-stats', async (_, accountUuid?: string, period?: 'day' | 'week' | 'month') => {
    try {
      return await getAppService().getStats(accountUuid || 'default', period || 'day');
    } catch (error) {
      logger.error('Failed to get stats', error);
      throw error;
    }
  });

  ipcMain.handle('dashboard:get-recent-activity', async (_, accountUuid?: string, limit?: number) => {
    try {
      return await getAppService().getRecentActivity(accountUuid || 'default', limit || 10);
    } catch (error) {
      logger.error('Failed to get recent activity', error);
      throw error;
    }
  });

  // ===== Widget Configuration =====

  ipcMain.handle('dashboard:get-widgets', async (_, accountUuid?: string) => {
    try {
      const widgetConfig = await getAppService().getWidgetConfig(accountUuid || 'default');
      return { widgets: widgetConfig };
    } catch (error) {
      logger.error('Failed to get widgets', error);
      throw error;
    }
  });

  ipcMain.handle('dashboard:update-widgets', async (_, accountUuid: string | undefined, widgets: any) => {
    try {
      // Handle legacy signature: (widgets) or new signature: (accountUuid, widgets)
      const actualAccountUuid = typeof accountUuid === 'string' && widgets ? accountUuid : 'default';
      const actualWidgets = widgets || accountUuid;
      
      const updatedConfig = await getAppService().updateWidgetConfig(actualAccountUuid, actualWidgets);
      return { success: true, widgets: updatedConfig };
    } catch (error) {
      logger.error('Failed to update widgets', error);
      throw error;
    }
  });

  ipcMain.handle('dashboard:reset-widgets', async (_, accountUuid?: string) => {
    try {
      const resetConfig = await getAppService().resetWidgetConfig(accountUuid || 'default');
      return { success: true, widgets: resetConfig };
    } catch (error) {
      logger.error('Failed to reset widgets', error);
      throw error;
    }
  });

  // ===== Statistics =====

  ipcMain.handle('dashboard:get-statistics', async (_, accountUuid?: string) => {
    try {
      return await getAppService().getStatistics(accountUuid || 'default');
    } catch (error) {
      logger.error('Failed to get dashboard statistics', error);
      throw error;
    }
  });

  ipcMain.handle('dashboard:invalidate-cache', async (_, accountUuid?: string) => {
    try {
      await getAppService().invalidateCache(accountUuid || 'default');
      return { success: true };
    } catch (error) {
      logger.error('Failed to invalidate cache', error);
      throw error;
    }
  });

  logger.info(`Dashboard IPC handlers registered (${IPC_CHANNELS.length} channels)`);
}

/**
 * 注销 Dashboard 模块的 IPC 处理器
 */
export function unregisterDashboardIpcHandlers(): void {
  logger.info('Unregistering Dashboard IPC handlers...');

  for (const channel of IPC_CHANNELS) {
    ipcMain.removeHandler(channel);
  }

  // Reset service instance
  appService = null;

  logger.info('Dashboard IPC handlers unregistered');
}
