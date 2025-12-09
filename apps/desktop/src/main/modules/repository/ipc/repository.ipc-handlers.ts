/**
 * Repository Module IPC Handlers
 *
 * Repository 模块 IPC 处理器
 * 复用 RepositoryDesktopApplicationService 中的逻辑
 *
 * 功能分组：
 * - Sync：同步操作（离线模式）
 * - Backup：备份管理
 * - Import/Export：数据导入导出
 */

import { ipcMain } from 'electron';
import { createLogger } from '@dailyuse/utils';

import {
  RepositoryDesktopApplicationService,
  type BackupOptions,
  type ExportOptions,
  type ImportOptions,
} from '../application/RepositoryDesktopApplicationService';

const logger = createLogger('RepositoryIpcHandlers');

// 惰性初始化的服务实例
let appService: RepositoryDesktopApplicationService | null = null;

function getAppService(): RepositoryDesktopApplicationService {
  if (!appService) {
    appService = new RepositoryDesktopApplicationService();
  }
  return appService;
}

// 所有 IPC channel 名称
const IPC_CHANNELS = [
  // Sync
  'repository:sync:start',
  'repository:sync:stop',
  'repository:sync:get-status',
  'repository:sync:force',
  'repository:sync:get-conflicts',
  'repository:sync:resolve-conflict',
  // Backup
  'repository:backup:create',
  'repository:backup:restore',
  'repository:backup:list',
  'repository:backup:delete',
  'repository:backup:get',
  // Import/Export
  'repository:export',
  'repository:import',
  'repository:get-export-formats',
  'repository:validate-import',
  // Storage
  'repository:get-storage-info',
] as const;

/**
 * 注册 Repository 模块的 IPC 处理器
 */
export function registerRepositoryIpcHandlers(): void {
  logger.info('Registering Repository IPC handlers...');

  // ============================================
  // Sync Handlers
  // ============================================

  ipcMain.handle('repository:sync:start', async () => {
    try {
      return await getAppService().startSync();
    } catch (error) {
      logger.error('Failed to start sync', error);
      throw error;
    }
  });

  ipcMain.handle('repository:sync:stop', async () => {
    try {
      return await getAppService().stopSync();
    } catch (error) {
      logger.error('Failed to stop sync', error);
      throw error;
    }
  });

  ipcMain.handle('repository:sync:get-status', async () => {
    try {
      return await getAppService().getSyncStatus();
    } catch (error) {
      logger.error('Failed to get sync status', error);
      throw error;
    }
  });

  ipcMain.handle('repository:sync:force', async () => {
    try {
      return await getAppService().forceSync();
    } catch (error) {
      logger.error('Failed to force sync', error);
      throw error;
    }
  });

  ipcMain.handle('repository:sync:get-conflicts', async () => {
    try {
      return await getAppService().getSyncConflicts();
    } catch (error) {
      logger.error('Failed to get sync conflicts', error);
      throw error;
    }
  });

  ipcMain.handle('repository:sync:resolve-conflict', async (_, conflictId: string, resolution: 'local' | 'remote' | 'merge') => {
    try {
      return await getAppService().resolveSyncConflict(conflictId, resolution);
    } catch (error) {
      logger.error('Failed to resolve sync conflict', error);
      throw error;
    }
  });

  // ============================================
  // Backup Handlers
  // ============================================

  ipcMain.handle('repository:backup:create', async (_, options?: BackupOptions) => {
    try {
      return await getAppService().createBackup(options || {});
    } catch (error) {
      logger.error('Failed to create backup', error);
      throw error;
    }
  });

  ipcMain.handle('repository:backup:restore', async (_, backupId: string) => {
    try {
      return await getAppService().restoreBackup(backupId);
    } catch (error) {
      logger.error('Failed to restore backup', error);
      throw error;
    }
  });

  ipcMain.handle('repository:backup:list', async () => {
    try {
      return await getAppService().listBackups();
    } catch (error) {
      logger.error('Failed to list backups', error);
      throw error;
    }
  });

  ipcMain.handle('repository:backup:delete', async (_, backupId: string) => {
    try {
      return await getAppService().deleteBackup(backupId);
    } catch (error) {
      logger.error('Failed to delete backup', error);
      throw error;
    }
  });

  ipcMain.handle('repository:backup:get', async (_, backupId: string) => {
    try {
      return await getAppService().getBackup(backupId);
    } catch (error) {
      logger.error('Failed to get backup', error);
      return null;
    }
  });

  // ============================================
  // Import/Export Handlers
  // ============================================

  ipcMain.handle('repository:export', async (_, options: ExportOptions) => {
    try {
      return await getAppService().exportData(options);
    } catch (error) {
      logger.error('Failed to export data', error);
      throw error;
    }
  });

  ipcMain.handle('repository:import', async (_, data: string, options: ImportOptions) => {
    try {
      return await getAppService().importData(data, options);
    } catch (error) {
      logger.error('Failed to import data', error);
      throw error;
    }
  });

  ipcMain.handle('repository:get-export-formats', async () => {
    try {
      return await getAppService().getExportFormats();
    } catch (error) {
      logger.error('Failed to get export formats', error);
      throw error;
    }
  });

  ipcMain.handle('repository:validate-import', async (_, data: string, format: 'json' | 'csv') => {
    try {
      return await getAppService().validateImportData(data, format);
    } catch (error) {
      logger.error('Failed to validate import', error);
      throw error;
    }
  });

  // ============================================
  // Storage Handlers
  // ============================================

  ipcMain.handle('repository:get-storage-info', async () => {
    try {
      return await getAppService().getStorageInfo();
    } catch (error) {
      logger.error('Failed to get storage info', error);
      throw error;
    }
  });

  logger.info(`Repository IPC handlers registered (${IPC_CHANNELS.length} channels)`);
}

/**
 * 注销 Repository 模块的 IPC 处理器
 */
export function unregisterRepositoryIpcHandlers(): void {
  logger.info('Unregistering Repository IPC handlers...');

  for (const channel of IPC_CHANNELS) {
    ipcMain.removeHandler(channel);
  }

  // Reset service instance
  appService = null;

  logger.info('Repository IPC handlers unregistered');
}
