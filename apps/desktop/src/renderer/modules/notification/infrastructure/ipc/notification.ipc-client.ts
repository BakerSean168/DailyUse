/**
 * Notification IPC Client - Notification 模块 IPC 客户端
 * 
 * @module renderer/modules/notification/infrastructure/ipc
 */

import { BaseIPCClient, ipcClient } from '@/renderer/shared/infrastructure/ipc';
import { NotificationChannels } from '@/shared/types/ipc-channels';

// ============ Types ============

export interface NotificationDTO {
  uuid: string;
  accountUuid: string;
  type: NotificationType;
  title: string;
  body: string;
  icon?: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  actions?: NotificationActionDTO[];
  data?: Record<string, unknown>;
  linkedEntityType?: string;
  linkedEntityUuid?: string;
  expiresAt?: number;
  readAt?: number;
  dismissedAt?: number;
  createdAt: number;
}

export type NotificationType =
  | 'task_reminder'
  | 'goal_update'
  | 'schedule_alert'
  | 'focus_break'
  | 'habit_reminder'
  | 'achievement'
  | 'system'
  | 'sync'
  | 'ai_insight';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type NotificationStatus = 'pending' | 'delivered' | 'read' | 'dismissed' | 'expired';

export interface NotificationActionDTO {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'destructive';
  data?: Record<string, unknown>;
}

export interface NotificationSettingsDTO {
  enabled: boolean;
  sound: boolean;
  soundFile?: string;
  badge: boolean;
  preview: 'full' | 'partial' | 'none';
  grouping: boolean;
  persistentBadge: boolean;
  quietHours: QuietHoursDTO;
  categorySettings: Record<NotificationType, CategorySettingDTO>;
}

export interface QuietHoursDTO {
  enabled: boolean;
  startTime: string;
  endTime: string;
  allowUrgent: boolean;
  daysOfWeek: number[];
}

export interface CategorySettingDTO {
  enabled: boolean;
  sound: boolean;
  badge: boolean;
  priority: NotificationPriority;
}

export interface CreateNotificationRequest {
  type: NotificationType;
  title: string;
  body: string;
  icon?: string;
  priority?: NotificationPriority;
  actions?: NotificationActionDTO[];
  data?: Record<string, unknown>;
}

// ============ Notification IPC Client ============

/**
 * Notification IPC Client
 */
export class NotificationIPCClient {
  private client: BaseIPCClient;

  constructor(client: BaseIPCClient = ipcClient) {
    this.client = client;
  }

  // ============ Notifications CRUD ============

  /**
   * 获取通知列表
   */
  async list(params?: { status?: NotificationStatus; type?: NotificationType }): Promise<NotificationDTO[]> {
    return this.client.invoke<NotificationDTO[]>(
      NotificationChannels.LIST,
      params || {}
    );
  }

  /**
   * 获取单个通知
   */
  async get(uuid: string): Promise<NotificationDTO> {
    return this.client.invoke<NotificationDTO>(
      NotificationChannels.GET,
      { uuid }
    );
  }

  /**
   * 创建通知
   */
  async create(params: CreateNotificationRequest): Promise<NotificationDTO> {
    return this.client.invoke<NotificationDTO>(
      NotificationChannels.CREATE,
      params
    );
  }

  /**
   * 标记为已读
   */
  async markAsRead(uuid: string): Promise<NotificationDTO> {
    return this.client.invoke<NotificationDTO>(
      NotificationChannels.MARK_READ,
      { uuid }
    );
  }

  /**
   * 标记全部为已读
   */
  async markAllAsRead(): Promise<void> {
    return this.client.invoke<void>(
      NotificationChannels.MARK_ALL_READ,
      {}
    );
  }

  /**
   * 删除通知
   */
  async delete(uuid: string): Promise<void> {
    return this.client.invoke<void>(
      NotificationChannels.DELETE,
      { uuid }
    );
  }

  /**
   * 清空全部通知
   */
  async clearAll(): Promise<void> {
    return this.client.invoke<void>(
      NotificationChannels.CLEAR_ALL,
      {}
    );
  }

  /**
   * 获取未读数量
   */
  async getUnreadCount(): Promise<number> {
    return this.client.invoke<number>(
      NotificationChannels.GET_UNREAD_COUNT,
      {}
    );
  }

  // ============ Settings ============

  /**
   * 获取通知设置
   */
  async getSettings(): Promise<NotificationSettingsDTO> {
    return this.client.invoke<NotificationSettingsDTO>(
      NotificationChannels.SETTINGS_GET,
      {}
    );
  }

  /**
   * 更新通知设置
   */
  async updateSettings(settings: Partial<NotificationSettingsDTO>): Promise<NotificationSettingsDTO> {
    return this.client.invoke<NotificationSettingsDTO>(
      NotificationChannels.SETTINGS_UPDATE,
      settings
    );
  }

  // ============ System Notifications ============

  /**
   * 显示系统通知
   */
  async show(params: {
    title: string;
    body: string;
    icon?: string;
    silent?: boolean;
  }): Promise<void> {
    return this.client.invoke<void>(
      NotificationChannels.SHOW,
      params
    );
  }

  /**
   * 隐藏通知
   */
  async hide(uuid: string): Promise<void> {
    return this.client.invoke<void>(
      NotificationChannels.HIDE,
      { uuid }
    );
  }

  // ============ Subscriptions ============

  /**
   * 订阅通知
   */
  async subscribe(types: NotificationType[]): Promise<void> {
    return this.client.invoke<void>(
      NotificationChannels.SUBSCRIBE,
      { types }
    );
  }

  /**
   * 取消订阅
   */
  async unsubscribe(types: NotificationType[]): Promise<void> {
    return this.client.invoke<void>(
      NotificationChannels.UNSUBSCRIBE,
      { types }
    );
  }

  // ============ Event Handlers ============

  /**
   * 订阅通知接收事件
   */
  onReceived(handler: (notification: NotificationDTO) => void): () => void {
    return this.client.on(NotificationChannels.EVENT_RECEIVED, handler);
  }

  /**
   * 订阅通知点击事件
   */
  onClicked(handler: (notification: NotificationDTO) => void): () => void {
    return this.client.on(NotificationChannels.EVENT_CLICKED, handler);
  }
}

// ============ Singleton Export ============

export const notificationIPCClient = new NotificationIPCClient();
   * 获取通知统计
   */
  async getStatistics(accountUuid: string): Promise<NotificationStatisticsDTO> {
    return this.client.invoke<NotificationStatisticsDTO>(
      NotificationChannels.STATISTICS_GET,
      { accountUuid }
    );
  }

  // ============ Batch Operations ============

  /**
   * 批量发送通知
   */
  async sendBatch(notifications: NotificationPayloads.SendRequest[]): Promise<NotificationDTO[]> {
    return this.client.invoke<NotificationDTO[]>(
      NotificationChannels.SEND_BATCH,
      { notifications }
    );
  }

  // ============ Convenience Methods ============

  /**
   * 获取未读通知
   */
  async getUnread(accountUuid: string): Promise<NotificationDTO[]> {
    const notifications = await this.list({ accountUuid });
    return notifications.filter(n => n.status === 'pending' || n.status === 'delivered');
  }

  /**
   * 快速发送通知
   */
  async quickSend(params: {
    accountUuid: string;
    title: string;
    body: string;
    type?: NotificationType;
    priority?: NotificationPriority;
  }): Promise<NotificationDTO> {
    return this.send({
      ...params,
      type: params.type || 'system',
      priority: params.priority || 'normal',
    });
  }

  // ============ Event Subscriptions ============

  /**
   * 订阅新通知
   */
  onNotificationReceived(handler: (notification: NotificationDTO) => void): () => void {
    return this.client.on(NotificationChannels.EVENT_RECEIVED, handler);
  }

  /**
   * 订阅通知点击
   */
  onNotificationClicked(handler: (notification: NotificationDTO) => void): () => void {
    return this.client.on(NotificationChannels.EVENT_CLICKED, handler);
  }

  /**
   * 订阅通知动作
   */
  onNotificationAction(handler: (data: { notification: NotificationDTO; actionId: string }) => void): () => void {
    return this.client.on(NotificationChannels.EVENT_ACTION, handler);
  }

  /**
   * 订阅通知关闭
   */
  onNotificationClosed(handler: (uuid: string) => void): () => void {
    return this.client.on(NotificationChannels.EVENT_CLOSED, handler);
  }

  /**
   * 订阅未读数变化
   */
  onUnreadCountChanged(handler: (count: number) => void): () => void {
    return this.client.on(NotificationChannels.EVENT_UNREAD_CHANGED, handler);
  }
}

// ============ Singleton Export ============

export const notificationIPCClient = new NotificationIPCClient();
