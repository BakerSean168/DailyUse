/**
 * Notification Application Service - Renderer
 *
 * 通知模块应用服务层
 * 封装 @dailyuse/application-client 的 Notification Use Cases
 */

import {
  createNotification,
  findNotifications,
  findNotificationByUuid,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  batchDeleteNotifications,
  getUnreadCount,
  type CreateNotificationInput,
  type FindNotificationsInput,
  type MarkAllAsReadOutput,
  type DeleteNotificationOutput,
  type BatchDeleteNotificationsOutput,
  type GetUnreadCountOutput,
} from '@dailyuse/application-client';
import type { NotificationClientDTO } from '@dailyuse/contracts/notification';

/**
 * 通知应用服务
 *
 * 提供通知相关的所有业务操作
 */
export class NotificationApplicationService {
  /**
   * 创建通知
   */
  async createNotification(input: CreateNotificationInput): Promise<NotificationClientDTO> {
    return createNotification(input);
  }

  /**
   * 查找通知列表
   */
  async findNotifications(input?: FindNotificationsInput): Promise<NotificationClientDTO[]> {
    return findNotifications(input);
  }

  /**
   * 根据 UUID 查找通知
   */
  async findNotificationByUuid(uuid: string): Promise<NotificationClientDTO | null> {
    return findNotificationByUuid(uuid);
  }

  /**
   * 标记为已读
   */
  async markAsRead(uuid: string): Promise<NotificationClientDTO> {
    return markAsRead(uuid);
  }

  /**
   * 标记全部为已读
   */
  async markAllAsRead(): Promise<MarkAllAsReadOutput> {
    return markAllAsRead();
  }

  /**
   * 删除通知
   */
  async deleteNotification(uuid: string): Promise<DeleteNotificationOutput> {
    return deleteNotification(uuid);
  }

  /**
   * 批量删除通知
   */
  async batchDeleteNotifications(uuids: string[]): Promise<BatchDeleteNotificationsOutput> {
    return batchDeleteNotifications(uuids);
  }

  /**
   * 获取未读数量
   */
  async getUnreadCount(): Promise<GetUnreadCountOutput> {
    return getUnreadCount();
  }
}

/**
 * 通知应用服务单例
 */
export const notificationApplicationService = new NotificationApplicationService();
