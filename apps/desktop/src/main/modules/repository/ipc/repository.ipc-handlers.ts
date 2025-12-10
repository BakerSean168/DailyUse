/**
 * Repository Module IPC Handlers
 *
 * 使用 BaseIPCHandler 统一处理 IPC 请求
 * Repository 模块 IPC 处理器
 * 复用 RepositoryDesktopApplicationService 中的逻辑
 *
 * 功能分组：
 * - Sync：同步操作（离线模式）
 * - Backup：备份管理
 * - Import/Export：数据导入导出
 */

import { ipcMain } from 'electron';
import { BaseIPCHandler } from '../../shared/application/base-ipc-handler';

import {
  RepositoryDesktopApplicationService,
  type BackupOptions,
  type ExportOptions,
  type ImportOptions,
} from '../application/RepositoryDesktopApplicationService';

export class RepositoryIPCHandler extends BaseIPCHandler {
  private appService: RepositoryDesktopApplicationService;

  constructor() {
    super('RepositoryIPCHandler');
    this.appService = new RepositoryDesktopApplicationService();
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // ============================================
    // Sync Handlers
    // ============================================

    ipcMain.handle('repository:sync:start', async () => {
      return this.handleRequest('repository:sync:start', () => this.appService.startSync());
    });

    ipcMain.handle('repository:sync:stop', async () => {
      return this.handleRequest('repository:sync:stop', () => this.appService.stopSync());
    });

    ipcMain.handle('repository:sync:get-status', async () => {
      return this.handleRequest('repository:sync:get-status', () =>
        this.appService.getSyncStatus(),
      );
    });

    ipcMain.handle('repository:sync:force', async () => {
      return this.handleRequest('repository:sync:force', () => this.appService.forceSync());
    });

    ipcMain.handle('repository:sync:get-conflicts', async () => {
      return this.handleRequest('repository:sync:get-conflicts', () =>
        this.appService.getSyncConflicts(),
      );
    });

    ipcMain.handle(
      'repository:sync:resolve-conflict',
      async (_, conflictId: string, resolution: 'local' | 'remote' | 'merge') => {
        return this.handleRequest('repository:sync:resolve-conflict', () =>
          this.appService.resolveSyncConflict(conflictId, resolution),
        );
      },
    );

    // ============================================
    // Backup Handlers
    // ============================================

    ipcMain.handle('repository:backup:create', async (_, options?: BackupOptions) => {
      return this.handleRequest('repository:backup:create', () =>
        this.appService.createBackup(options || {}),
      );
    });

    ipcMain.handle('repository:backup:restore', async (_, backupId: string) => {
      return this.handleRequest('repository:backup:restore', () =>
        this.appService.restoreBackup(backupId),
      );
    });

    ipcMain.handle('repository:backup:list', async () => {
      return this.handleRequest('repository:backup:list', () =>
        this.appService.listBackups(),
      );
    });

    ipcMain.handle('repository:backup:delete', async (_, backupId: string) => {
      return this.handleRequest('repository:backup:delete', () =>
        this.appService.deleteBackup(backupId),
      );
    });

    ipcMain.handle('repository:backup:get', async (_, backupId: string) => {
      return this.handleRequest('repository:backup:get', () =>
        this.appService.getBackup(backupId),
      );
    });

    // ============================================
    // Import/Export Handlers
    // ============================================

    ipcMain.handle('repository:export', async (_, options: ExportOptions) => {
      return this.handleRequest('repository:export', () =>
        this.appService.exportData(options),
      );
    });

    ipcMain.handle('repository:import', async (_, data: string, options: ImportOptions) => {
      return this.handleRequest('repository:import', () =>
        this.appService.importData(data, options),
      );
    });

    ipcMain.handle('repository:get-export-formats', async () => {
      return this.handleRequest('repository:get-export-formats', () =>
        this.appService.getExportFormats(),
      );
    });

    ipcMain.handle(
      'repository:validate-import',
      async (_, data: string, format: 'json' | 'csv') => {
        return this.handleRequest('repository:validate-import', () =>
          this.appService.validateImportData(data, format),
        );
      },
    );

    // ============================================
    // Storage Handlers
    // ============================================

    ipcMain.handle('repository:get-storage-info', async () => {
      return this.handleRequest('repository:get-storage-info', () =>
        this.appService.getStorageInfo(),
      );
    });
  }
}

/**
 * 注册 Repository 模块的 IPC 处理器（已弃用）
 *
 * @deprecated 使用 RepositoryIPCHandler 类代替
 */
export function registerRepositoryIpcHandlers(): void {
  const handler = new RepositoryIPCHandler();
  (global as any).repositoryIPCHandler = handler;
}

/**
 * 注销 Repository 模块的 IPC 处理器（已弃用）
 *
 * @deprecated 由应用生命周期管理自动处理
 */
export function unregisterRepositoryIpcHandlers(): void {
  // IPC 通道由 Electron 在应用退出时自动清理
}
