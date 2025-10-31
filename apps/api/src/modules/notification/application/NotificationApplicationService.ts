// @ts-nocheck
/**
 * NotificationApplicationService
 * 通知应用服务 - 处理业务逻辑
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { Notification } from '@dailyuse/domain-server/notification';
import type { NotificationRepository, FindNotificationsOptions } from '@dailyuse/domain-server/notification';
import type { NotificationContracts } from '@dailyuse/contracts';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';

type NotificationClientDTO = NotificationContracts.NotificationClientDTO;
type CreateNotificationRequest = NotificationContracts.CreateNotificationRequest;
type QueryNotificationsRequest = NotificationContracts.QueryNotificationsRequest;
type NotificationListResponse = NotificationContracts.NotificationListResponse;

@Injectable()
export class NotificationApplicationService {
  constructor(
    private readonly notificationRepository: NotificationRepository
  ) {}

  /**
   * 创建通知
   */
  async createNotification(
    accountUuid: string,
    request: CreateNotificationRequest
  ): Promise<NotificationClientDTO> {
    const notification = Notification.create({
      accountUuid,
      title: request.title,
      content: request.content,
      type: request.type,
      category: request.category,
      importance: request.importance || ImportanceLevel.NORMAL,
      urgency: request.urgency || UrgencyLevel.NORMAL,
      relatedEntityType: request.relatedEntityType,
      relatedEntityUuid: request.relatedEntityUuid,
      metadata: request.metadata,
      expiresAt: request.expiresAt,
    });

    // 标记为已发送（站内通知立即生效）
    notification.markAsSent();

    await this.notificationRepository.save(notification);

    return notification.toClientDTO();
  }

  /**
   * 查询通知列表
   */
  async findNotifications(
    accountUuid: string,
    query: QueryNotificationsRequest
  ): Promise<NotificationListResponse> {
    const options: FindNotificationsOptions = {
      page: query.page || 1,
      limit: query.limit || 20,
      status: query.status || 'ALL',
      type: query.type,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder || 'desc',
    };

    const { notifications, total } = await this.notificationRepository.findByAccountUuid(
      accountUuid,
      options
    );

    const unreadCount = await this.notificationRepository.countUnread(accountUuid);

    return {
      notifications: notifications.map(n => n.toClientDTO()),
      total,
      page: options.page!,
      limit: options.limit!,
      unreadCount,
    };
  }

  /**
   * 根据 UUID 查找通知
   */
  async findNotificationByUuid(
    uuid: string,
    accountUuid: string
  ): Promise<NotificationClientDTO> {
    const notification = await this.notificationRepository.findByUuid(uuid);

    if (!notification) {
      throw new NotFoundException(`Notification with UUID ${uuid} not found`);
    }

    // 安全检查：确保通知属于当前用户
    if (notification.accountUuid !== accountUuid) {
      throw new NotFoundException(`Notification with UUID ${uuid} not found`);
    }

    return notification.toClientDTO();
  }

  /**
   * 标记通知为已读
   */
  async markAsRead(uuid: string, accountUuid: string): Promise<NotificationClientDTO> {
    const notification = await this.notificationRepository.findByUuid(uuid);

    if (!notification) {
      throw new NotFoundException(`Notification with UUID ${uuid} not found`);
    }

    if (notification.accountUuid !== accountUuid) {
      throw new NotFoundException(`Notification with UUID ${uuid} not found`);
    }

    notification.markAsRead();

    await this.notificationRepository.save(notification);

    return notification.toClientDTO();
  }

  /**
   * 标记所有通知为已读
   */
  async markAllAsRead(accountUuid: string): Promise<{ success: boolean; count: number }> {
    const count = await this.notificationRepository.markAllAsRead(accountUuid);

    return { success: true, count };
  }

  /**
   * 删除通知
   */
  async deleteNotification(uuid: string, accountUuid: string): Promise<{ success: boolean }> {
    const notification = await this.notificationRepository.findByUuid(uuid);

    if (!notification) {
      throw new NotFoundException(`Notification with UUID ${uuid} not found`);
    }

    if (notification.accountUuid !== accountUuid) {
      throw new NotFoundException(`Notification with UUID ${uuid} not found`);
    }

    notification.softDelete();

    await this.notificationRepository.save(notification);

    return { success: true };
  }

  /**
   * 批量删除通知
   */
  async batchDeleteNotifications(
    uuids: string[],
    accountUuid: string
  ): Promise<{ success: boolean; count: number }> {
    // 验证所有通知都属于当前用户
    const notifications = await Promise.all(
      uuids.map(uuid => this.notificationRepository.findByUuid(uuid))
    );

    const validUuids = notifications
      .filter(n => n && n.accountUuid === accountUuid)
      .map(n => n!.uuid);

    const count = await this.notificationRepository.deleteMany(validUuids);

    return { success: true, count };
  }

  /**
   * 获取未读数量
   */
  async getUnreadCount(accountUuid: string): Promise<{ count: number }> {
    const count = await this.notificationRepository.countUnread(accountUuid);

    return { count };
  }
}
