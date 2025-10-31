// @ts-nocheck
/**
 * PrismaNotificationRepository 实现
 * 使用 Prisma 实现 NotificationRepository
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import type { NotificationRepository, FindNotificationsOptions } from '@dailyuse/domain-server/notification';
import { Notification } from '@dailyuse/domain-server/notification';
import type { NotificationContracts } from '@dailyuse/contracts';

type NotificationPersistenceDTO = NotificationContracts.NotificationPersistenceDTO;

@Injectable()
export class PrismaNotificationRepository implements NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(notification: Notification): Promise<void> {
    const data = notification.toPersistence();
    
    await this.prisma.notification.upsert({
      where: { uuid: data.uuid },
      create: {
        uuid: data.uuid,
        accountUuid: data.accountUuid,
        type: data.type,
        category: data.category,
        importance: data.importance,
        urgency: data.urgency,
        title: data.title,
        content: data.content,
        metadata: data.metadata || '{}',
        status: data.status,
        isRead: data.isRead,
        readAt: data.readAt,
        relatedEntityType: data.relatedEntityType,
        relatedEntityUuid: data.relatedEntityUuid,
        expiresAt: data.expiresAt,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        sentAt: data.sentAt,
        deliveredAt: data.deliveredAt,
        deletedAt: data.deletedAt,
      },
      update: {
        status: data.status,
        isRead: data.isRead,
        readAt: data.readAt,
        updatedAt: data.updatedAt,
        sentAt: data.sentAt,
        deliveredAt: data.deliveredAt,
        deletedAt: data.deletedAt,
      },
    });
  }

  async findByUuid(uuid: string): Promise<Notification | null> {
    const record = await this.prisma.notification.findUnique({
      where: { uuid },
    });

    if (!record) {
      return null;
    }

    return this.toDomain(record);
  }

  async findByAccountUuid(
    accountUuid: string,
    options: FindNotificationsOptions = {}
  ): Promise<{ notifications: Notification[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      status = 'ALL',
      type,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const where: any = {
      accountUuid,
      deletedAt: null,
    };

    // 状态筛选
    if (status === 'READ') {
      where.isRead = true;
    } else if (status === 'UNREAD') {
      where.isRead = false;
    }

    // 类型筛选
    if (type) {
      where.type = type;
    }

    // 查询总数
    const total = await this.prisma.notification.count({ where });

    // 查询列表
    const records = await this.prisma.notification.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    const notifications = records.map(record => this.toDomain(record));

    return { notifications, total };
  }

  async countUnread(accountUuid: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        accountUuid,
        isRead: false,
        deletedAt: null,
      },
    });
  }

  async markAllAsRead(accountUuid: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: {
        accountUuid,
        isRead: false,
        deletedAt: null,
      },
      data: {
        isRead: true,
        readAt: Date.now(),
        status: 'READ',
        updatedAt: Date.now(),
      },
    });

    return result.count;
  }

  async deleteMany(uuids: string[]): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: {
        uuid: { in: uuids },
      },
      data: {
        deletedAt: Date.now(),
        status: 'DELETED',
        updatedAt: Date.now(),
      },
    });

    return result.count;
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.notification.update({
      where: { uuid },
      data: {
        deletedAt: Date.now(),
        status: 'DELETED',
        updatedAt: Date.now(),
      },
    });
  }

  private toDomain(record: any): Notification {
    const dto: NotificationPersistenceDTO = {
      uuid: record.uuid,
      accountUuid: record.accountUuid,
      type: record.type,
      category: record.category,
      importance: record.importance,
      urgency: record.urgency,
      title: record.title,
      content: record.content,
      metadata: record.metadata,
      status: record.status,
      isRead: record.isRead,
      readAt: record.readAt,
      relatedEntityType: record.relatedEntityType,
      relatedEntityUuid: record.relatedEntityUuid,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      sentAt: record.sentAt,
      deliveredAt: record.deliveredAt,
      deletedAt: record.deletedAt,
    };

    return Notification.fromPersistence(dto);
  }
}
