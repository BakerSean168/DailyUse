/**
 * Notification 领域服务
 *
 * DDD 领域服务职责：
 * - 跨聚合根的业务逻辑
 * - 协调多个聚合根
 * - 使用仓储接口进行持久化
 * - 触发领域事件
 */

import type { INotificationRepository } from '../repositories/INotificationRepository';
import type { INotificationTemplateRepository } from '../repositories/INotificationTemplateRepository';
import type { INotificationPreferenceRepository } from '../repositories/INotificationPreferenceRepository';
import { Notification } from '../aggregates/Notification';
import type { NotificationActionServerDTO, NotificationMetadataServerDTO, RelatedEntityType } from '@dailyuse/contracts/notification';
import { NotificationCategory, NotificationType } from '@dailyuse/contracts/notification';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts/shared';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('NotificationDomainService');

/**
 * NotificationDomainService
 *
 * 注意：
 * - 通过构造函数注入仓储接口
 * - 不直接操作数据库
 * - 业务逻辑在聚合根/实体中，服务只是协调
 */
export class NotificationDomainService {
  constructor(
    private readonly notificationRepo: INotificationRepository,
    private readonly templateRepo: INotificationTemplateRepository,
    private readonly preferenceRepo: INotificationPreferenceRepository,
    // 可以注入其他服务
    // private readonly eventBus: IEventBus,
  ) {}

  /**
   * 创建并发送通知
   */
  public async createAndSendNotification(params: {
    accountUuid: string;
    title: string;
    content: string;
    type: NotificationType;
    category: NotificationCategory;
    importance?: ImportanceLevel;
    urgency?: UrgencyLevel;
    relatedEntityType?: RelatedEntityType;
    relatedEntityUuid?: string;
    actions?: NotificationActionServerDTO[];
    metadata?: NotificationMetadataServerDTO;
    expiresAt?: number;
    channels?: string[]; // 指定发送渠道
  }): Promise<Notification> {
    logger.info('🔔 [领域服务] 开始创建通知', {
      accountUuid: params.accountUuid,
      title: params.title,
      type: params.type,
      category: params.category,
      relatedEntityType: params.relatedEntityType,
      relatedEntityUuid: params.relatedEntityUuid,
      channels: params.channels,
    });

    // 1. 检查用户偏好设置
    const preference = await this.preferenceRepo.findByAccountUuid(params.accountUuid);

    if (preference) {
      logger.debug('📋 检查用户偏好设置', {
        accountUuid: params.accountUuid,
        hasPreference: true,
      });

      // 检查是否应该发送通知
      const shouldSend = preference.shouldSendNotification(
        params.category,
        params.type,
        'inApp', // 默认检查应用内通知
      );

      if (!shouldSend) {
        logger.warn('⛔ 用户偏好阻止发送通知', {
          accountUuid: params.accountUuid,
          category: params.category,
          type: params.type,
        });
        throw new Error('User preferences block this notification');
      }

      logger.debug('✅ 用户偏好允许发送通知');
    } else {
      logger.debug('📋 用户无偏好设置，使用默认设置');
    }

    // 2. 创建通知聚合根
    logger.debug('🏗️ 创建通知聚合根');
    const notification = Notification.create(params);

    logger.info('✅ 通知聚合根已创建', {
      notificationUuid: notification.uuid,
      title: notification.title,
      type: notification.type,
      category: notification.category,
    });

    // 3. 添加渠道
    const channels = params.channels ?? ['inApp']; // 默认只发送应用内通知
    logger.debug('📡 添加通知渠道', { channels });
    
    for (const channelType of channels) {
      notification.createChannel({
        channelType,
        recipient: params.accountUuid,
      });
      logger.debug(`  ➕ 已添加渠道: ${channelType}`);
    }

    // 4. 发送通知
    logger.debug('📤 标记通知为已发送');
    await notification.send();

    logger.info('✅ 通知已标记为已发送', {
      notificationUuid: notification.uuid,
      status: notification.status,
      sentAt: notification.sentAt,
    });

    // 5. 持久化
    logger.debug('💾 持久化通知到数据库');
    await this.notificationRepo.save(notification);

    logger.info('✅✅✅ [领域服务] 通知创建完成', {
      notificationUuid: notification.uuid,
      accountUuid: notification.accountUuid,
      title: notification.title,
      type: notification.type,
      category: notification.category,
      status: notification.status,
      relatedEntityType: notification.relatedEntityType,
      relatedEntityUuid: notification.relatedEntityUuid,
      channelCount: channels.length,
      isRead: notification.isRead,
      createdAt: new Date(notification.createdAt).toISOString(),
    });

    // 6. 触发领域事件 - 用于 SSE 推送
    const notificationDTO = notification.toServerDTO();
    logger.info('📡 [领域服务] 发布 NotificationCreated 领域事件', {
      notificationUuid: notification.uuid,
      accountUuid: notification.accountUuid,
    });

    // 这里需要通过事件总线发布，让 SSE 管理器接收并推送
    // 我们在应用服务层处理这个逻辑

    return notification;
  }

  /**
   * 从模板创建通知
   */
  public async createNotificationFromTemplate(params: {
    accountUuid: string;
    templateUuid: string;
    variables: Record<string, any>;
    relatedEntityType?: RelatedEntityType;
    relatedEntityUuid?: string;
    channels?: string[];
  }): Promise<Notification> {
    // 1. 获取模板
    const template = await this.templateRepo.findById(params.templateUuid);
    if (!template) {
      throw new Error(`Template not found: ${params.templateUuid}`);
    }

    if (!template.isActive) {
      throw new Error(`Template is not active: ${params.templateUuid}`);
    }

    // 2. 验证变量
    const validation = template.validateVariables(params.variables);
    if (!validation.isValid) {
      throw new Error(`Missing template variables: ${validation.missingVariables.join(', ')}`);
    }

    // 3. 渲染模板
    const rendered = template.render(params.variables);

    // 4. 创建并发送通知
    return await this.createAndSendNotification({
      accountUuid: params.accountUuid,
      title: rendered.title,
      content: rendered.content,
      type: template.type,
      category: template.category,
      relatedEntityType: params.relatedEntityType,
      relatedEntityUuid: params.relatedEntityUuid,
      channels: params.channels,
    });
  }

  /**
   * 批量发送通知
   */
  public async sendBulkNotifications(
    notifications: Array<{
      accountUuid: string;
      title: string;
      content: string;
      type: NotificationType;
      category: NotificationCategory;
      importance?: ImportanceLevel;
      urgency?: UrgencyLevel;
    }>,
  ): Promise<Notification[]> {
    const created: Notification[] = [];

    for (const params of notifications) {
      try {
        const notification = await this.createAndSendNotification(params);
        created.push(notification);
      } catch (error) {
        // 记录错误但继续处理其他通知
        console.error(`Failed to send notification to ${params.accountUuid}:`, error);
      }
    }

    return created;
  }

  /**
   * 标记通知为已读
   */
  public async markAsRead(uuid: string): Promise<void> {
    const notification = await this.notificationRepo.findById(uuid);
    if (!notification) {
      throw new Error(`Notification not found: ${uuid}`);
    }

    notification.markAsRead();
    await this.notificationRepo.save(notification);

    // 触发已读事件
    // await this.eventBus.publish({
    //   type: 'notification.read',
    //   aggregateId: uuid,
    //   timestamp: Date.now(),
    //   payload: { notificationUuid: uuid },
    // });
  }

  /**
   * 批量标记为已读
   */
  public async markManyAsRead(uuids: string[]): Promise<void> {
    await this.notificationRepo.markManyAsRead(uuids);
  }

  /**
   * 标记所有通知为已读
   */
  public async markAllAsRead(accountUuid: string): Promise<void> {
    await this.notificationRepo.markAllAsRead(accountUuid);
  }

  /**
   * 删除通知
   */
  public async deleteNotification(uuid: string, soft = true): Promise<void> {
    if (soft) {
      await this.notificationRepo.softDelete(uuid);
    } else {
      await this.notificationRepo.delete(uuid);
    }
  }

  /**
   * 批量删除通知
   */
  public async deleteManyNotifications(uuids: string[], soft = true): Promise<void> {
    if (soft) {
      // 软删除需要逐个处理
      for (const uuid of uuids) {
        await this.notificationRepo.softDelete(uuid);
      }
    } else {
      await this.notificationRepo.deleteMany(uuids);
    }
  }

  /**
   * 获取通知详情
   */
  public async getNotification(
    uuid: string,
    options?: { includeChildren?: boolean },
  ): Promise<Notification | null> {
    return await this.notificationRepo.findById(uuid, options);
  }

  /**
   * 获取用户的通知列表
   */
  public async getUserNotifications(
    accountUuid: string,
    options?: {
      includeRead?: boolean;
      limit?: number;
      offset?: number;
    },
  ): Promise<Notification[]> {
    return await this.notificationRepo.findByAccountUuid(accountUuid, {
      includeRead: options?.includeRead ?? true,
      includeDeleted: false,
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  /**
   * 获取未读通知
   */
  public async getUnreadNotifications(
    accountUuid: string,
    options?: { limit?: number },
  ): Promise<Notification[]> {
    return await this.notificationRepo.findUnread(accountUuid, options);
  }

  /**
   * 获取未读通知数量
   */
  public async getUnreadCount(accountUuid: string): Promise<number> {
    return await this.notificationRepo.countUnread(accountUuid);
  }

  /**
   * 获取分类统计
   */
  public async getCategoryStats(
    accountUuid: string,
  ): Promise<Record<NotificationCategory, number>> {
    return await this.notificationRepo.countByCategory(accountUuid);
  }

  /**
   * 执行通知操作
   */
  public async executeNotificationAction(
    notificationUuid: string,
    actionId: string,
  ): Promise<void> {
    const notification = await this.notificationRepo.findById(notificationUuid);
    if (!notification) {
      throw new Error(`Notification not found: ${notificationUuid}`);
    }

    await notification.executeAction(actionId);
    await this.notificationRepo.save(notification);

    // 触发操作执行事件
    // await this.eventBus.publish({
    //   type: 'notification.action.executed',
    //   aggregateId: notificationUuid,
    //   timestamp: Date.now(),
    //   payload: {
    //     notificationUuid,
    //     actionId,
    //   },
    // });
  }

  /**
   * 清理过期通知
   */
  public async cleanupExpiredNotifications(): Promise<number> {
    const now = Date.now();
    return await this.notificationRepo.cleanupExpired(now);
  }

  /**
   * 清理已删除通知（超过30天）
   */
  public async cleanupDeletedNotifications(daysAgo = 30): Promise<number> {
    const threshold = Date.now() - daysAgo * 24 * 60 * 60 * 1000;
    return await this.notificationRepo.cleanupDeleted(threshold);
  }

  /**
   * 获取相关实体的通知
   */
  public async getNotificationsByRelatedEntity(
    relatedEntityType: string,
    relatedEntityUuid: string,
  ): Promise<Notification[]> {
    return await this.notificationRepo.findByRelatedEntity(relatedEntityType, relatedEntityUuid);
  }
}
