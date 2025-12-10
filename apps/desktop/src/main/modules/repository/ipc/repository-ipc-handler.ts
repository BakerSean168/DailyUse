/**
 * Repository IPC 处理器
 * 处理所有与仓库（同步、备份、导入导出）相关的 IPC 请求
 */

import { ipcMain } from 'electron';
import { BaseIPCHandler } from '../../shared/application/base-ipc-handler';
import { RepositoryDesktopApplicationService, type BackupOptions, type ExportOptions, type ImportOptions } from '../application/RepositoryDesktopApplicationService';

export class RepositoryIPCHandler extends BaseIPCHandler {
  private repositoryService: RepositoryDesktopApplicationService;

  constructor() {
    super('RepositoryIPCHandler');
    this.repositoryService = new RepositoryDesktopApplicationService();
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // ===== 同步操作 =====

    // 开始同步
    ipcMain.handle('repository:start-sync', async () => {
      return this.handleRequest(
        'repository:start-sync',
        () => this.repositoryService.startSync(),
      );
    });

    // 停止同步
    ipcMain.handle('repository:stop-sync', async () => {
      return this.handleRequest(
        'repository:stop-sync',
        () => this.repositoryService.stopSync(),
      );
    });

    // 获取同步状态
    ipcMain.handle('repository:get-sync-status', async () => {
      return this.handleRequest(
        'repository:get-sync-status',
        () => this.repositoryService.getSyncStatus(),
      );
    });

    // 强制同步
    ipcMain.handle('repository:force-sync', async () => {
      return this.handleRequest(
        'repository:force-sync',
        () => this.repositoryService.forceSync(),
      );
    });

    // 获取同步冲突
    ipcMain.handle('repository:get-sync-conflicts', async () => {
      return this.handleRequest(
        'repository:get-sync-conflicts',
        () => this.repositoryService.getSyncConflicts(),
      );
    });

    // 解决同步冲突
    ipcMain.handle('repository:resolve-sync-conflict', async (event, payload: { conflictId: string; resolution: 'local' | 'remote' | 'merge' }) => {
      return this.handleRequest(
        'repository:resolve-sync-conflict',
        () => this.repositoryService.resolveSyncConflict(payload.conflictId, payload.resolution),
      );
    });

    // ===== 备份操作 =====

    // 创建备份
    ipcMain.handle('repository:create-backup', async (event, options?: BackupOptions) => {
      return this.handleRequest(
        'repository:create-backup',
        () => this.repositoryService.createBackup(options),
      );
    });

    // 恢复备份
    ipcMain.handle('repository:restore-backup', async (event, backupId: string) => {
      return this.handleRequest(
        'repository:restore-backup',
        () => this.repositoryService.restoreBackup(backupId),
      );
    });

    // 列出备份
    ipcMain.handle('repository:list-backups', async () => {
      return this.handleRequest(
        'repository:list-backups',
        () => this.repositoryService.listBackups(),
      );
    });

    // 删除备份
    ipcMain.handle('repository:delete-backup', async (event, backupId: string) => {
      return this.handleRequest(
        'repository:delete-backup',
        () => this.repositoryService.deleteBackup(backupId),
      );
    });

    // 获取备份详情
    ipcMain.handle('repository:get-backup', async (event, backupId: string) => {
      return this.handleRequest(
        'repository:get-backup',
        () => this.repositoryService.getBackup(backupId),
      );
    });

    // ===== 导入导出操作 =====

    // 导出数据
    ipcMain.handle('repository:export-data', async (event, options: ExportOptions) => {
      return this.handleRequest(
        'repository:export-data',
        () => this.repositoryService.exportData(options),
      );
    });

    // 导入数据
    ipcMain.handle('repository:import-data', async (event, payload: { data: string; options: ImportOptions }) => {
      return this.handleRequest(
        'repository:import-data',
        () => this.repositoryService.importData(payload.data, payload.options),
      );
    });

    // 获取支持的格式
    ipcMain.handle('repository:get-supported-formats', async () => {
      return this.handleRequest(
        'repository:get-supported-formats',
        () => this.repositoryService.getExportFormats(),
      );
    });

    // 验证导入数据
    ipcMain.handle('repository:validate-import', async (event, payload: { data: string; format: 'json' | 'csv' }) => {
      return this.handleRequest(
        'repository:validate-import',
        () => this.repositoryService.validateImportData(payload.data, payload.format),
      );
    });

    // 获取存储信息
    ipcMain.handle('repository:get-storage-info', async () => {
      return this.handleRequest(
        'repository:get-storage-info',
        () => this.repositoryService.getStorageInfo(),
      );
    });

    this.logger.info('Registered Repository IPC handlers');
  }
}

export const repositoryIPCHandler = new RepositoryIPCHandler();
