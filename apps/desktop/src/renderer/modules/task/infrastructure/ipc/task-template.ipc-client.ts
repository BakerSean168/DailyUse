/**
 * Task Template IPC Client - Task 模板 IPC 客户端
 * 
 * @module renderer/modules/task/infrastructure/ipc
 */

import { BaseIPCClient, ipcClient } from '@/renderer/shared/infrastructure/ipc';
import { TaskChannels } from '@/shared/types/ipc-channels';
import type { TaskPayloads } from '@/shared/types/ipc-payloads';

// ============ Types ============

export interface TaskTemplateDTO {
  uuid: string;
  accountUuid: string;
  title: string;
  description?: string;
  priority: number;
  dueDate?: number;
  tags: string[];
  folderId?: string;
  goalUuid?: string;
  archived: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface TaskFolderDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  color?: string;
  icon?: string;
  parentId?: string;
  order: number;
  createdAt: number;
}

// ============ Task Template IPC Client ============

/**
 * Task Template IPC Client
 */
export class TaskTemplateIPCClient {
  private client: BaseIPCClient;

  constructor(client: BaseIPCClient = ipcClient) {
    this.client = client;
  }

  // ============ CRUD ============

  /**
   * 获取任务模板列表
   */
  async list(params: TaskPayloads.ListRequest): Promise<TaskTemplateDTO[]> {
    return this.client.invoke<TaskTemplateDTO[]>(
      TaskChannels.TEMPLATE_LIST,
      params
    );
  }

  /**
   * 获取单个任务模板
   */
  async get(uuid: string): Promise<TaskTemplateDTO> {
    return this.client.invoke<TaskTemplateDTO>(
      TaskChannels.TEMPLATE_GET,
      { uuid }
    );
  }

  /**
   * 创建任务模板
   */
  async create(params: TaskPayloads.CreateRequest): Promise<TaskTemplateDTO> {
    return this.client.invoke<TaskTemplateDTO>(
      TaskChannels.TEMPLATE_CREATE,
      params
    );
  }

  /**
   * 更新任务模板
   */
  async update(params: TaskPayloads.UpdateRequest): Promise<TaskTemplateDTO> {
    return this.client.invoke<TaskTemplateDTO>(
      TaskChannels.TEMPLATE_UPDATE,
      params
    );
  }

  /**
   * 删除任务模板
   */
  async delete(uuid: string): Promise<void> {
    return this.client.invoke<void>(
      TaskChannels.TEMPLATE_DELETE,
      { uuid }
    );
  }

  // ============ Operations ============

  /**
   * 归档任务模板
   */
  async archive(uuid: string): Promise<TaskTemplateDTO> {
    return this.client.invoke<TaskTemplateDTO>(
      TaskChannels.TEMPLATE_ARCHIVE,
      { uuid }
    );
  }

  /**
   * 恢复任务模板
   */
  async restore(uuid: string): Promise<TaskTemplateDTO> {
    return this.client.invoke<TaskTemplateDTO>(
      TaskChannels.TEMPLATE_RESTORE,
      { uuid }
    );
  }

  /**
   * 移动到文件夹
   */
  async moveToFolder(uuid: string, folderId: string | null): Promise<void> {
    return this.client.invoke<void>(
      TaskChannels.TEMPLATE_MOVE_TO_FOLDER,
      { uuid, folderId }
    );
  }

  /**
   * 重排序
   */
  async reorder(uuids: string[]): Promise<void> {
    return this.client.invoke<void>(
      TaskChannels.TEMPLATE_REORDER,
      { uuids }
    );
  }

  // ============ Folder Operations ============

  /**
   * 获取文件夹列表
   */
  async listFolders(accountUuid: string): Promise<TaskFolderDTO[]> {
    return this.client.invoke<TaskFolderDTO[]>(
      TaskChannels.FOLDER_LIST,
      { accountUuid }
    );
  }

  /**
   * 创建文件夹
   */
  async createFolder(params: TaskPayloads.FolderCreateRequest): Promise<TaskFolderDTO> {
    return this.client.invoke<TaskFolderDTO>(
      TaskChannels.FOLDER_CREATE,
      params
    );
  }

  /**
   * 更新文件夹
   */
  async updateFolder(params: TaskPayloads.FolderUpdateRequest): Promise<TaskFolderDTO> {
    return this.client.invoke<TaskFolderDTO>(
      TaskChannels.FOLDER_UPDATE,
      params
    );
  }

  /**
   * 删除文件夹
   */
  async deleteFolder(uuid: string): Promise<void> {
    return this.client.invoke<void>(
      TaskChannels.FOLDER_DELETE,
      { uuid }
    );
  }
}

// ============ Singleton Export ============

export const taskTemplateIPCClient = new TaskTemplateIPCClient();
