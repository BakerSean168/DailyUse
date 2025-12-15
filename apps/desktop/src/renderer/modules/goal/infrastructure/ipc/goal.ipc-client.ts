/**
 * Goal IPC Client - Goal 模块 IPC 客户端
 * 
 * @module renderer/modules/goal/infrastructure/ipc
 */

import { BaseIPCClient, ipcClient } from '@/renderer/shared/infrastructure/ipc';
import { GoalChannels } from '@/shared/types/ipc-channels';
import type { GoalPayloads } from '@/shared/types/ipc-payloads';

// ============ Types ============

export interface GoalDTO {
  uuid: string;
  accountUuid: string;
  title: string;
  description?: string;
  status: GoalStatus;
  priority: number;
  progress: number;
  targetDate?: number;
  startDate?: number;
  completedAt?: number;
  folderId?: string;
  parentGoalUuid?: string;
  color?: string;
  icon?: string;
  archived: boolean;
  createdAt: number;
  updatedAt: number;
}

export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';

export interface GoalFolderDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  color?: string;
  icon?: string;
  parentId?: string;
  order: number;
  createdAt: number;
}

export interface GoalStatisticsDTO {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  onHold: number;
  cancelled: number;
  completionRate: number;
  averageProgress: number;
}

// ============ Goal IPC Client ============

/**
 * Goal IPC Client
 */
export class GoalIPCClient {
  private client: BaseIPCClient;

  constructor(client: BaseIPCClient = ipcClient) {
    this.client = client;
  }

  // ============ CRUD ============

  /**
   * 获取目标列表
   */
  async list(params: GoalPayloads.ListRequest): Promise<GoalDTO[]> {
    return this.client.invoke<GoalDTO[]>(
      GoalChannels.LIST,
      params
    );
  }

  /**
   * 获取单个目标
   */
  async get(uuid: string): Promise<GoalDTO> {
    return this.client.invoke<GoalDTO>(
      GoalChannels.GET,
      { uuid }
    );
  }

  /**
   * 创建目标
   */
  async create(params: GoalPayloads.CreateRequest): Promise<GoalDTO> {
    return this.client.invoke<GoalDTO>(
      GoalChannels.CREATE,
      params
    );
  }

  /**
   * 更新目标
   */
  async update(params: GoalPayloads.UpdateRequest): Promise<GoalDTO> {
    return this.client.invoke<GoalDTO>(
      GoalChannels.UPDATE,
      params
    );
  }

  /**
   * 删除目标
   */
  async delete(uuid: string): Promise<void> {
    return this.client.invoke<void>(
      GoalChannels.DELETE,
      { uuid }
    );
  }

  // ============ Operations ============

  /**
   * 归档目标
   */
  async archive(uuid: string): Promise<GoalDTO> {
    return this.client.invoke<GoalDTO>(
      GoalChannels.ARCHIVE,
      { uuid }
    );
  }

  /**
   * 恢复目标
   */
  async restore(uuid: string): Promise<GoalDTO> {
    return this.client.invoke<GoalDTO>(
      GoalChannels.RESTORE,
      { uuid }
    );
  }

  /**
   * 移动到文件夹
   */
  async moveToFolder(uuid: string, folderId: string | null): Promise<void> {
    return this.client.invoke<void>(
      GoalChannels.MOVE_TO_FOLDER,
      { uuid, folderId }
    );
  }

  /**
   * 更新进度
   */
  async updateProgress(uuid: string, progress: number): Promise<GoalDTO> {
    return this.client.invoke<GoalDTO>(
      GoalChannels.UPDATE_PROGRESS,
      { uuid, progress }
    );
  }

  // ============ Folder Operations ============

  /**
   * 获取文件夹列表
   */
  async listFolders(accountUuid: string): Promise<GoalFolderDTO[]> {
    return this.client.invoke<GoalFolderDTO[]>(
      GoalChannels.FOLDER_LIST,
      { accountUuid }
    );
  }

  /**
   * 创建文件夹
   */
  async createFolder(params: {
    accountUuid: string;
    name: string;
    color?: string;
    icon?: string;
    parentId?: string;
  }): Promise<GoalFolderDTO> {
    return this.client.invoke<GoalFolderDTO>(
      GoalChannels.FOLDER_CREATE,
      params
    );
  }

  /**
   * 更新文件夹
   */
  async updateFolder(params: {
    uuid: string;
    name?: string;
    color?: string;
    icon?: string;
  }): Promise<GoalFolderDTO> {
    return this.client.invoke<GoalFolderDTO>(
      GoalChannels.FOLDER_UPDATE,
      params
    );
  }

  /**
   * 删除文件夹
   */
  async deleteFolder(uuid: string): Promise<void> {
    return this.client.invoke<void>(
      GoalChannels.FOLDER_DELETE,
      { uuid }
    );
  }

  // ============ Statistics ============

  /**
   * 获取统计数据
   */
  async getStatistics(accountUuid: string): Promise<GoalStatisticsDTO> {
    return this.client.invoke<GoalStatisticsDTO>(
      GoalChannels.STATISTICS_GET,
      { accountUuid }
    );
  }

  // ============ Convenience Methods ============

  /**
   * 获取活跃目标（进行中）
   */
  async getActive(accountUuid: string): Promise<GoalDTO[]> {
    const goals = await this.list({ accountUuid, status: 'in_progress' });
    return goals;
  }

  /**
   * 获取即将到期的目标
   */
  async getUpcoming(accountUuid: string, days = 7): Promise<GoalDTO[]> {
    const goals = await this.list({ accountUuid });
    const now = Date.now();
    const futureDate = now + days * 24 * 60 * 60 * 1000;
    
    return goals.filter(g => 
      g.targetDate && 
      g.targetDate > now && 
      g.targetDate <= futureDate &&
      g.status !== 'completed'
    );
  }

  /**
   * 获取子目标
   */
  async getChildren(parentGoalUuid: string): Promise<GoalDTO[]> {
    // 通过 list 获取并过滤
    const goals = await this.list({ accountUuid: '' }); // 需要 accountUuid
    return goals.filter(g => g.parentGoalUuid === parentGoalUuid);
  }
}

// ============ Singleton Export ============

export const goalIPCClient = new GoalIPCClient();
