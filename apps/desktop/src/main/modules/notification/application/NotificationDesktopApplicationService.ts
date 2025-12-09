/**
 * Notification Desktop Application Service
 *
 * 包装 @dailyuse/application-server/notification 的所有 Use Cases
 * 为 Desktop IPC handlers 提供统一的应用服务入口
 */

import {
  createNotification,
  getNotification,
  getUserNotifications,
  getUnreadNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getPreference,
  getOrCreatePreference,
  type CreateNotificationInput,
  type ChannelPreferences,
  NotificationService,
} from '@dailyuse/application-server';

import type {
  NotificationClientDTO,
  NotificationPreferenceClientDTO,
  NotificationCategory,
  CategoryPreferenceServerDTO,
  DoNotDisturbConfigServerDTO,
} from '@dailyuse/contracts/notification';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('NotificationDesktopAppService');

export class NotificationDesktopApplicationService {
  constructor() {
    // Container should be initialized by infrastructure module
  }

  // ===== Notification CRUD =====

  async create(input: CreateNotificationInput): Promise<NotificationClientDTO> {
    logger.debug('Creating notification', { title: input.title });
    return createNotification(input);
  }

  async get(uuid: string, includeChildren = false): Promise<NotificationClientDTO | null> {
    return getNotification(uuid, { includeChildren });
  }

  async list(
    accountUuid: string,
    options?: { includeRead?: boolean; limit?: number; offset?: number },
  ): Promise<NotificationClientDTO[]> {
    return getUserNotifications(accountUuid, options);
  }

  async listUnread(
    accountUuid: string,
    limit?: number,
  ): Promise<NotificationClientDTO[]> {
    return getUnreadNotifications(accountUuid, { limit });
  }

  async getUnreadCount(accountUuid: string): Promise<number> {
    return getUnreadCount(accountUuid);
  }

  async markAsRead(uuid: string): Promise<void> {
    await markAsRead(uuid);
  }

  async markAllAsRead(accountUuid: string): Promise<void> {
    await markAllAsRead(accountUuid);
  }

  async delete(uuid: string, soft = true): Promise<void> {
    await deleteNotification(uuid, soft);
  }

  // ===== Notification Preferences =====

  async getPreference(accountUuid: string): Promise<NotificationPreferenceClientDTO | null> {
    return getPreference(accountUuid);
  }

  async getOrCreatePreference(accountUuid: string): Promise<NotificationPreferenceClientDTO> {
    return getOrCreatePreference(accountUuid);
  }

  async updatePreference(
    accountUuid: string,
    updates: Partial<{
      channelPreferences: ChannelPreferences;
      categoryPreferences: Record<NotificationCategory, Partial<CategoryPreferenceServerDTO>>;
      doNotDisturbConfig: Partial<DoNotDisturbConfigServerDTO>;
    }>,
  ): Promise<NotificationPreferenceClientDTO> {
    const service = NotificationService.getInstance();
    return service.updatePreference(accountUuid, updates);
  }

  // ===== Statistics =====

  async getStatisticsSummary(accountUuid: string): Promise<{
    total: number;
    unread: number;
    read: number;
  }> {
    const unreadCount = await getUnreadCount(accountUuid);
    const notifications = await getUserNotifications(accountUuid, { includeRead: true });
    const readCount = notifications.filter((n) => n.readAt).length;

    return {
      total: notifications.length,
      unread: unreadCount,
      read: readCount,
    };
  }
}
