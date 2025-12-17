/**
 * Repository IPC Client - Repository 模块 IPC 客户端
 * 
 * @module renderer/modules/repository/infrastructure/ipc
 */

import { BaseIPCClient, ipcClient } from '@/renderer/shared/infrastructure/ipc';
import { RepositoryChannels } from '@/shared/types/ipc-channels';

// ============ Types ============

export interface RepositoryDTO {
  uuid: string;
  name: string;
  description?: string;
  type: RepositoryType;
  path: string;
  createdAt: number;
  updatedAt: number;
}

export type RepositoryType = 'local' | 'cloud' | 'sync';

export interface ResourceDTO {
  uuid: string;
  repositoryUuid: string;
  name: string;
  type: string;
  path: string;
  size: number;
  createdAt: number;
  updatedAt: number;
}

export interface FolderDTO {
  uuid: string;
  repositoryUuid: string;
  name: string;
  path: string;
  parentUuid?: string;
  createdAt: number;
}

export interface BackupDTO {
  uuid: string;
  name: string;
  description?: string;
  type: BackupType;
  status: BackupStatus;
  size: number;
  path: string;
  createdAt: number;
  completedAt?: number;
}

export type BackupType = 'full' | 'incremental' | 'differential';
export type BackupStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

export interface ExportOptions {
  format: ExportFormat;
  modules?: string[];
  includeAttachments?: boolean;
}

export type ExportFormat = 'json' | 'csv' | 'excel' | 'markdown';

export interface ImportOptions {
  source: ImportSource;
  conflictResolution?: 'skip' | 'overwrite' | 'merge';
}

export type ImportSource = 'json' | 'csv' | 'todoist' | 'notion';

// ============ Repository IPC Client ============

/**
 * Repository IPC Client
 */
export class RepositoryIPCClient {
  private client: BaseIPCClient;

  constructor(client: BaseIPCClient = ipcClient) {
    this.client = client;
  }

  // ============ Repository CRUD ============

  /**
   * 获取仓库列表
   */
  async list(): Promise<RepositoryDTO[]> {
    return this.client.invoke<RepositoryDTO[]>(
      RepositoryChannels.LIST,
      {}
    );
  }

  /**
   * 获取单个仓库
   */
  async get(uuid: string): Promise<RepositoryDTO> {
    return this.client.invoke<RepositoryDTO>(
      RepositoryChannels.GET,
      { uuid }
    );
  }

  /**
   * 创建仓库
   */
  async create(params: { name: string; type: RepositoryType; description?: string }): Promise<RepositoryDTO> {
    return this.client.invoke<RepositoryDTO>(
      RepositoryChannels.CREATE,
      params
    );
  }

  /**
   * 更新仓库
   */
  async update(params: { uuid: string; name?: string; description?: string }): Promise<RepositoryDTO> {
    return this.client.invoke<RepositoryDTO>(
      RepositoryChannels.UPDATE,
      params
    );
  }

  /**
   * 删除仓库
   */
  async delete(uuid: string): Promise<void> {
    return this.client.invoke<void>(
      RepositoryChannels.DELETE,
      { uuid }
    );
  }

  // ============ Resources ============

  /**
   * 获取资源列表
   */
  async listResources(repositoryUuid: string): Promise<ResourceDTO[]> {
    return this.client.invoke<ResourceDTO[]>(
      RepositoryChannels.RESOURCE_LIST,
      { repositoryUuid }
    );
  }

  /**
   * 获取资源
   */
  async getResource(uuid: string): Promise<ResourceDTO> {
    return this.client.invoke<ResourceDTO>(
      RepositoryChannels.RESOURCE_GET,
      { uuid }
    );
  }

  /**
   * 创建资源
   */
  async createResource(params: {
    repositoryUuid: string;
    name: string;
    type: string;
    path: string;
  }): Promise<ResourceDTO> {
    return this.client.invoke<ResourceDTO>(
      RepositoryChannels.RESOURCE_CREATE,
      params
    );
  }

  /**
   * 更新资源
   */
  async updateResource(params: { uuid: string; name?: string }): Promise<ResourceDTO> {
    return this.client.invoke<ResourceDTO>(
      RepositoryChannels.RESOURCE_UPDATE,
      params
    );
  }

  /**
   * 删除资源
   */
  async deleteResource(uuid: string): Promise<void> {
    return this.client.invoke<void>(
      RepositoryChannels.RESOURCE_DELETE,
      { uuid }
    );
  }

  // ============ Folders ============

  /**
   * 获取文件夹列表
   */
  async listFolders(repositoryUuid: string): Promise<FolderDTO[]> {
    return this.client.invoke<FolderDTO[]>(
      RepositoryChannels.FOLDER_LIST,
      { repositoryUuid }
    );
  }

  /**
   * 创建文件夹
   */
  async createFolder(params: {
    repositoryUuid: string;
    name: string;
    parentUuid?: string;
  }): Promise<FolderDTO> {
    return this.client.invoke<FolderDTO>(
      RepositoryChannels.FOLDER_CREATE,
      params
    );
  }

  /**
   * 更新文件夹
   */
  async updateFolder(params: { uuid: string; name?: string }): Promise<FolderDTO> {
    return this.client.invoke<FolderDTO>(
      RepositoryChannels.FOLDER_UPDATE,
      params
    );
  }

  /**
   * 删除文件夹
   */
  async deleteFolder(uuid: string): Promise<void> {
    return this.client.invoke<void>(
      RepositoryChannels.FOLDER_DELETE,
      { uuid }
    );
  }

  // ============ Search ============

  /**
   * 搜索
   */
  async search(query: string): Promise<Array<RepositoryDTO | ResourceDTO | FolderDTO>> {
    return this.client.invoke(
      RepositoryChannels.SEARCH,
      { query }
    );
  }

  // ============ Import / Export ============

  /**
   * 导入数据
   */
  async import(filePath: string, options: ImportOptions): Promise<{
    itemsImported: number;
    errors?: string[];
  }> {
    return this.client.invoke(
      RepositoryChannels.IMPORT,
      { filePath, ...options }
    );
  }

  /**
   * 导出数据
   */
  async export(options: ExportOptions): Promise<{
    filePath: string;
    size: number;
  }> {
    return this.client.invoke(
      RepositoryChannels.EXPORT,
      options
    );
  }

  // ============ Backup ============

  /**
   * 创建备份
   */
  async createBackup(params: {
    name: string;
    type?: BackupType;
    description?: string;
  }): Promise<BackupDTO> {
    return this.client.invoke<BackupDTO>(
      RepositoryChannels.BACKUP_CREATE,
      params
    );
  }

  /**
   * 获取备份列表
   */
  async listBackups(): Promise<BackupDTO[]> {
    return this.client.invoke<BackupDTO[]>(
      RepositoryChannels.BACKUP_LIST,
      {}
    );
  }

  /**
   * 获取备份详情
   */
  async getBackupDetails(uuid: string): Promise<BackupDTO> {
    return this.client.invoke<BackupDTO>(
      RepositoryChannels.BACKUP_GET,
      { uuid }
    );
  }

  /**
   * 删除备份
   */
  async deleteBackup(uuid: string): Promise<void> {
    return this.client.invoke<void>(
      RepositoryChannels.BACKUP_DELETE,
      { uuid }
    );
  }

  /**
   * 从备份恢复
   */
  async restoreBackup(uuid: string): Promise<void> {
    return this.client.invoke<void>(
      RepositoryChannels.BACKUP_RESTORE,
      { uuid }
    );
  }

  /**
   * 快速全量备份
   */
  async quickFullBackup(accountUuid: string, name?: string): Promise<BackupDTO> {
    return this.createBackup({
      name: name || `Full Backup ${new Date().toISOString().split('T')[0]}`,
    });
  }

  /**
   * 快速导出为 JSON
   */
  async quickExportJson(accountUuid: string, modules?: string[]): Promise<{
    filePath: string;
    size: number;
  }> {
    return this.export({
      format: 'json',
      modules: modules || ['all'],
    });
  }

  // ============ Event Subscriptions ============

  /**
   * 订阅备份进度
   */
  onBackupProgress(handler: (backup: BackupDTO) => void): () => void {
    return this.client.on(RepositoryChannels.EVENT_BACKUP_PROGRESS, handler);
  }

  /**
   * 订阅恢复进度
   */
  onRestoreProgress(handler: (data: { progress: number }) => void): () => void {
    return this.client.on(RepositoryChannels.EVENT_RESTORE_PROGRESS, handler);
  }

  /**
   * 订阅导出进度
   */
  onExportProgress(handler: (data: { progress: number }) => void): () => void {
    return this.client.on(RepositoryChannels.EVENT_EXPORT_PROGRESS, handler);
  }

  /**
   * 订阅导入进度
   */
  onImportProgress(handler: (data: { progress: number }) => void): () => void {
    return this.client.on(RepositoryChannels.EVENT_IMPORT_PROGRESS, handler);
  }
}

// ============ Singleton Export ============

export const repositoryIPCClient = new RepositoryIPCClient();
