/**
 * Reminder IPC Client - Reminder 模块 IPC 客户端
 * 
 * @module renderer/modules/reminder/infrastructure/ipc
 */

import { BaseIPCClient, ipcClient } from '@/renderer/shared/infrastructure/ipc';
import { ReminderChannels } from '@/shared/types/ipc-channels';
import type { ReminderPayloads } from '@/shared/types/ipc-payloads';

// ============ Types ============

export interface ReminderDTO {
  uuid: string;
  accountUuid: string;
  title: string;
  description?: string;
  triggerAt: number;
  type: ReminderType;
  priority: ReminderPriority;
  status: ReminderStatus;
  linkedEntityType?: LinkedEntityType;
  linkedEntityUuid?: string;
  recurrence?: ReminderRecurrenceDTO;
  notification: NotificationConfigDTO;
  snoozedUntil?: number;
  acknowledgedAt?: number;
  dismissedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export type ReminderType = 'one_time' | 'recurring' | 'location_based';
export type ReminderPriority = 'low' | 'medium' | 'high' | 'critical';
export type ReminderStatus = 'pending' | 'triggered' | 'snoozed' | 'acknowledged' | 'dismissed';
export type LinkedEntityType = 'task' | 'goal' | 'schedule' | 'habit';

export interface ReminderRecurrenceDTO {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek?: number[];
  endDate?: number;
  occurrences?: number;
  totalTriggered: number;
}

export interface NotificationConfigDTO {
  enabled: boolean;
  sound: boolean;
  soundFile?: string;
  vibration: boolean;
  badge: boolean;
  persistent: boolean;
  preAlertMinutes?: number[];
}

export interface ReminderStatisticsDTO {
  total: number;
  pending: number;
  triggered: number;
  acknowledged: number;
  dismissed: number;
  snoozed: number;
  averageResponseTimeMs: number;
}

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
  async snooze(params: ReminderPayloads.SnoozeRequest): Promise<ReminderDTO> {
    return this.client.invoke<ReminderDTO>(
      ReminderChannels.SNOOZE,
      params
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
   * 获取待处理的提醒
   */
  async getPending(accountUuid: string): Promise<ReminderDTO[]> {
    const reminders = await this.list({ accountUuid });
    return reminders.filter(r => r.status === 'pending');
  }

  /**
   * 获取已触发未处理的提醒
   */
  async getTriggered(accountUuid: string): Promise<ReminderDTO[]> {
    const reminders = await this.list({ accountUuid });
    return reminders.filter(r => r.status === 'triggered');
  }

  /**
   * 获取已推迟的提醒
   */
  async getSnoozed(accountUuid: string): Promise<ReminderDTO[]> {
    const reminders = await this.list({ accountUuid });
    return reminders.filter(r => r.status === 'snoozed');
  }

  /**
   * 获取即将触发的提醒
   */
  async getUpcoming(accountUuid: string, hours = 24): Promise<ReminderDTO[]> {
    const now = Date.now();
    const futureTime = now + hours * 60 * 60 * 1000;

    const reminders = await this.list({ accountUuid });
    return reminders.filter(
      r => r.status === 'pending' && r.triggerAt >= now && r.triggerAt <= futureTime
    );
  }

  /**
   * 快速创建简单提醒
   */
  async quickCreate(params: {
    accountUuid: string;
    title: string;
    triggerAt: number;
    priority?: ReminderPriority;
  }): Promise<ReminderDTO> {
    return this.create({
      ...params,
      type: 'one_time',
      priority: params.priority || 'medium',
      notification: {
        enabled: true,
        sound: true,
        vibration: true,
        badge: true,
        persistent: false,
      },
    });
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
