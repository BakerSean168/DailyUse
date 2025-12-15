/**
 * Task Instance IPC Client - Task 实例 IPC 客户端
 * 
 * @module renderer/modules/task/infrastructure/ipc
 */

import { BaseIPCClient, ipcClient } from '@/renderer/shared/infrastructure/ipc';
import { TaskChannels } from '@/shared/types/ipc-channels';
import type { TaskPayloads } from '@/shared/types/ipc-payloads';

// ============ Types ============

export interface TaskInstanceDTO {
  uuid: string;
  templateUuid: string;
  accountUuid: string;
  title: string;
  description?: string;
  priority: number;
  dueDate: number;
  completed: boolean;
  completedAt?: number;
  skipped: boolean;
  skippedAt?: number;
  skipReason?: string;
  postponedFrom?: number;
  createdAt: number;
  updatedAt: number;
}

export interface TaskInstanceCompleteResult {
  instance: TaskInstanceDTO;
  streak?: number;
  xpGained?: number;
}

// ============ Task Instance IPC Client ============

/**
 * Task Instance IPC Client
 */
export class TaskInstanceIPCClient {
  private client: BaseIPCClient;

  constructor(client: BaseIPCClient = ipcClient) {
    this.client = client;
  }

  // ============ Query ============

  /**
   * 获取任务实例列表
   */
  async list(params: TaskPayloads.InstanceListRequest): Promise<TaskInstanceDTO[]> {
    return this.client.invoke<TaskInstanceDTO[]>(
      TaskChannels.INSTANCE_LIST,
      params
    );
  }

  /**
   * 获取单个任务实例
   */
  async get(uuid: string): Promise<TaskInstanceDTO> {
    return this.client.invoke<TaskInstanceDTO>(
      TaskChannels.INSTANCE_GET,
      { uuid }
    );
  }

  /**
   * 获取今日任务
   */
  async getToday(accountUuid: string): Promise<TaskInstanceDTO[]> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;

    return this.list({
      accountUuid,
      startDate: startOfDay,
      endDate: endOfDay,
    });
  }

  /**
   * 获取本周任务
   */
  async getThisWeek(accountUuid: string): Promise<TaskInstanceDTO[]> {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek).getTime();
    const endOfWeek = startOfWeek + 7 * 24 * 60 * 60 * 1000 - 1;

    return this.list({
      accountUuid,
      startDate: startOfWeek,
      endDate: endOfWeek,
    });
  }

  // ============ Operations ============

  /**
   * 创建任务实例（手动创建）
   */
  async create(params: {
    templateUuid: string;
    dueDate: number;
  }): Promise<TaskInstanceDTO> {
    return this.client.invoke<TaskInstanceDTO>(
      TaskChannels.INSTANCE_CREATE,
      params
    );
  }

  /**
   * 更新任务实例
   */
  async update(params: {
    uuid: string;
    title?: string;
    description?: string;
    priority?: number;
    dueDate?: number;
  }): Promise<TaskInstanceDTO> {
    return this.client.invoke<TaskInstanceDTO>(
      TaskChannels.INSTANCE_UPDATE,
      params
    );
  }

  /**
   * 删除任务实例
   */
  async delete(uuid: string): Promise<void> {
    return this.client.invoke<void>(
      TaskChannels.INSTANCE_DELETE,
      { uuid }
    );
  }

  /**
   * 完成任务实例
   */
  async complete(uuid: string, completedAt?: number): Promise<TaskInstanceCompleteResult> {
    return this.client.invoke<TaskInstanceCompleteResult>(
      TaskChannels.INSTANCE_COMPLETE,
      { uuid, completedAt: completedAt ?? Date.now() }
    );
  }

  /**
   * 取消完成任务实例
   */
  async uncomplete(uuid: string): Promise<TaskInstanceDTO> {
    return this.client.invoke<TaskInstanceDTO>(
      TaskChannels.INSTANCE_UNCOMPLETE,
      { uuid }
    );
  }

  /**
   * 跳过任务实例
   */
  async skip(uuid: string, reason?: string): Promise<TaskInstanceDTO> {
    return this.client.invoke<TaskInstanceDTO>(
      TaskChannels.INSTANCE_SKIP,
      { uuid, reason }
    );
  }

  /**
   * 延期任务实例
   */
  async postpone(uuid: string, newDueDate: number): Promise<TaskInstanceDTO> {
    return this.client.invoke<TaskInstanceDTO>(
      TaskChannels.INSTANCE_POSTPONE,
      { uuid, newDueDate }
    );
  }

  // ============ Batch Operations ============

  /**
   * 批量完成
   */
  async batchComplete(uuids: string[]): Promise<TaskInstanceCompleteResult[]> {
    const results: TaskInstanceCompleteResult[] = [];
    for (const uuid of uuids) {
      results.push(await this.complete(uuid));
    }
    return results;
  }

  /**
   * 批量延期
   */
  async batchPostpone(uuids: string[], newDueDate: number): Promise<TaskInstanceDTO[]> {
    const results: TaskInstanceDTO[] = [];
    for (const uuid of uuids) {
      results.push(await this.postpone(uuid, newDueDate));
    }
    return results;
  }
}

// ============ Singleton Export ============

export const taskInstanceIPCClient = new TaskInstanceIPCClient();
