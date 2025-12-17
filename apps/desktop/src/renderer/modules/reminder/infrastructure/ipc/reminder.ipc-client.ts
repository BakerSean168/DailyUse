/**
 * Reminder IPC Client - Reminder 模块 IPC 客户端
 * 
 * @module renderer/modules/reminder/infrastructure/ipc
 */

import { BaseIPCClient, ipcClient } from '@/renderer/shared/infrastructure/ipc';
import { ReminderChannels } from '@/shared/types/ipc-channels';
import type { ReminderPayloads } from '@/shared/types/ipc-payloads';

// ============ Types from contracts ============
// Re-export from contracts for convenience
export type {
  ReminderTemplateClientDTO,
  ReminderGroupClientDTO,
  ReminderStatisticsClientDTO,
  ReminderHistoryClientDTO,
} from '@dailyuse/contracts/reminder';

export {
  ReminderType,
  ReminderStatus,
} from '@dailyuse/contracts/reminder';

// Import types for internal use
import type {
  ReminderTemplateClientDTO,
  ReminderGroupClientDTO,
  ReminderStatisticsClientDTO,
} from '@dailyuse/contracts/reminder';
import { ReminderStatus } from '@dailyuse/contracts/reminder';

// ============ Local Type Aliases (backward compatibility) ============

/**
 * ReminderDTO 别名 - 映射到 ReminderTemplateClientDTO
 */
export type ReminderDTO = ReminderTemplateClientDTO;

/**
 * ReminderGroupDTO 别名
 */
export type ReminderGroupDTO = ReminderGroupClientDTO;

/**
 * ReminderStatisticsDTO 别名
 */
export type ReminderStatisticsDTO = ReminderStatisticsClientDTO;

/**
 * LinkedEntityType - 关联实体类型
 */
export type LinkedEntityType = 'task' | 'goal' | 'schedule' | 'habit';

// ============ Reminder IPC Client ============

/**
 * Reminder IPC Client
 */
export class ReminderIPCClient {
  private client: BaseIPCClient;

  constructor(client: BaseIPCClient = ipcClient) {
    this.client = client;
  }

  // ============ CRUD ============

  /**
   * 获取提醒列表
   */
  async list(params: ReminderPayloads.ListRequest): Promise<ReminderDTO[]> {
    return this.client.invoke<ReminderDTO[]>(
      ReminderChannels.LIST,
      params
    );
  }

  /**
   * 获取单个提醒
   */
  async get(uuid: string): Promise<ReminderDTO> {
    return this.client.invoke<ReminderDTO>(
      ReminderChannels.GET,
      { uuid }
    );
  }

  /**
   * 创建提醒
   */
  async create(params: ReminderPayloads.CreateRequest): Promise<ReminderDTO> {
    return this.client.invoke<ReminderDTO>(
      ReminderChannels.CREATE,
      params
    );
  }

  /**
   * 更新提醒
   */
  async update(params: ReminderPayloads.UpdateRequest): Promise<ReminderDTO> {
    return this.client.invoke<ReminderDTO>(
      ReminderChannels.UPDATE,
      params
    );
  }

  /**
   * 删除提醒
   */
  async delete(uuid: string): Promise<void> {
    return this.client.invoke<void>(
      ReminderChannels.DELETE,
      { uuid }
    );
  }

  // ============ Operations ============

  /**
   * 推迟提醒
   */
  async snooze(uuidOrParams: string | ReminderPayloads.SnoozeRequest, minutes?: number): Promise<ReminderDTO> {
    const params = typeof uuidOrParams === 'string'
      ? { uuid: uuidOrParams, minutes: minutes ?? 5 }
      : uuidOrParams;
    return this.client.invoke<ReminderDTO>(
      ReminderChannels.SNOOZE,
      params
    );
  }

  /**
   * 暂停提醒
   */
  async pause(uuid: string): Promise<ReminderDTO> {
    return this.client.invoke<ReminderDTO>(
      ReminderChannels.INSTANCE_SNOOZE, // Using instance snooze as pause
      { uuid, paused: true }
    );
  }

  /**
   * 恢复提醒
   */
  async resume(uuid: string): Promise<ReminderDTO> {
    return this.client.invoke<ReminderDTO>(
      ReminderChannels.INSTANCE_SNOOZE, // Using instance snooze as resume
      { uuid, paused: false }
    );
  }

  /**
   * 确认提醒
   */
  async acknowledge(uuid: string): Promise<ReminderDTO> {
    return this.client.invoke<ReminderDTO>(
      ReminderChannels.ACKNOWLEDGE,
      { uuid }
    );
  }

  /**
   * 忽略提醒
   */
  async dismiss(uuid: string): Promise<ReminderDTO> {
    return this.client.invoke<ReminderDTO>(
      ReminderChannels.DISMISS,
      { uuid }
    );
  }

  // ============ Linked Entity ============

  /**
   * 获取关联实体的提醒
   */
  async listByLinkedEntity(
    entityType: LinkedEntityType,
    entityUuid: string
  ): Promise<ReminderDTO[]> {
    return this.client.invoke<ReminderDTO[]>(
      ReminderChannels.LIST_BY_LINKED_ENTITY,
      { entityType, entityUuid }
    );
  }

  /**
   * 为任务创建提醒
   */
  async createForTask(
    taskUuid: string,
    params: Omit<ReminderPayloads.CreateRequest, 'linkedEntityType' | 'linkedEntityUuid'>
  ): Promise<ReminderDTO> {
    return this.create({
      ...params,
      linkedEntityType: 'task',
      linkedEntityUuid: taskUuid,
    });
  }

  /**
   * 为目标创建提醒
   */
  async createForGoal(
    goalUuid: string,
    params: Omit<ReminderPayloads.CreateRequest, 'linkedEntityType' | 'linkedEntityUuid'>
  ): Promise<ReminderDTO> {
    return this.create({
      ...params,
      linkedEntityType: 'goal',
      linkedEntityUuid: goalUuid,
    });
  }

  /**
   * 为日程创建提醒
   */
  async createForSchedule(
    scheduleUuid: string,
    params: Omit<ReminderPayloads.CreateRequest, 'linkedEntityType' | 'linkedEntityUuid'>
  ): Promise<ReminderDTO> {
    return this.create({
      ...params,
      linkedEntityType: 'schedule',
      linkedEntityUuid: scheduleUuid,
    });
  }

  // ============ Statistics ============

  /**
   * 获取统计数据
   */
  async getStatistics(
    accountUuid: string,
    startDate?: number,
    endDate?: number
  ): Promise<ReminderStatisticsDTO> {
    return this.client.invoke<ReminderStatisticsDTO>(
      ReminderChannels.STATISTICS_GET,
      { accountUuid, startDate, endDate }
    );
  }

  // ============ Convenience Methods ============

  /**
   * 获取活跃的提醒（未暂停）
   */
  async getActive(accountUuid: string): Promise<ReminderDTO[]> {
    const reminders = await this.list({ accountUuid });
    return reminders.filter(r => r.status === ReminderStatus.ACTIVE && r.isActive);
  }

  /**
   * 获取已暂停的提醒
   */
  async getPaused(accountUuid: string): Promise<ReminderDTO[]> {
    const reminders = await this.list({ accountUuid });
    return reminders.filter(r => r.status === ReminderStatus.PAUSED);
  }

  /**
   * 获取已暂停的提醒
   */
  async getSnoozed(accountUuid: string): Promise<ReminderDTO[]> {
    const reminders = await this.list({ accountUuid });
    return reminders.filter(r => r.isPaused);
  }

  /**
   * 获取即将触发的提醒
   */
  async getUpcoming(accountUuid: string, hours = 24): Promise<ReminderDTO[]> {
    const now = Date.now();
    const futureTime = now + hours * 60 * 60 * 1000;

    const reminders = await this.list({ accountUuid });
    return reminders.filter(
      r => r.isActive && r.nextTriggerAt && r.nextTriggerAt >= now && r.nextTriggerAt <= futureTime
    );
  }

  /**
   * 快速创建简单提醒
   */
  async quickCreate(params: {
    accountUuid: string;
    title: string;
    triggerAt: number;
  }): Promise<ReminderDTO> {
    return this.create({
      accountUuid: params.accountUuid,
      title: params.title,
      triggerTime: params.triggerAt,
      type: 'one_time',
      notification: {
        enabled: true,
        sound: true,
        vibration: true,
        badge: true,
        persistent: false,
      },
    });
  }

  // ============ Group Operations ============

  /**
   * 获取提醒分组列表
   */
  async listGroups(params: { accountUuid: string }): Promise<ReminderGroupDTO[]> {
    return this.client.invoke<ReminderGroupDTO[]>(
      ReminderChannels.GROUP_LIST,
      params
    );
  }

  // ============ Event Subscriptions ============

  /**
   * 订阅提醒触发事件
   */
  onReminderTriggered(handler: (reminder: ReminderDTO) => void): () => void {
    return this.client.on(ReminderChannels.EVENT_TRIGGERED, handler);
  }

  /**
   * 订阅提醒更新事件
   */
  onReminderUpdated(handler: (reminder: ReminderDTO) => void): () => void {
    return this.client.on(ReminderChannels.EVENT_UPDATED, handler);
  }

  /**
   * 订阅提醒删除事件
   */
  onReminderDeleted(handler: (uuid: string) => void): () => void {
    return this.client.on(ReminderChannels.EVENT_DELETED, handler);
  }
}

// ============ Singleton Export ============

export const reminderIPCClient = new ReminderIPCClient();
