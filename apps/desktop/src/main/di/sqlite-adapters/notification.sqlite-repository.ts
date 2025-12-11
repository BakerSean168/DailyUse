/**
 * SQLite Notification Repository
 *
 * 实现 INotificationRepository 接口
 */

import type { INotificationRepository, Notification } from '@dailyuse/domain-server/notification';
import { Notification as NotificationEntity } from '@dailyuse/domain-server/notification';
import { NotificationCategory, NotificationStatus } from '@dailyuse/contracts/notification';
import { getDatabase, transaction } from '../../database';

interface NotificationRow {
  uuid: string;
  account_uuid: string;
  title: string;
  content: string;
  type: string;
  category: string;
  importance: string;
  urgency: string;
  status: string;
  is_read: number;
  read_at: number | null;
  related_entity_type: string | null;
  related_entity_uuid: string | null;
  actions: string | null;
  metadata: string | null;
  expires_at: number | null;
  created_at: number;
  updated_at: number;
  sent_at: number | null;
  delivered_at: number | null;
  deleted_at: number | null;
}

export class SqliteNotificationRepository implements INotificationRepository {
  /**
   * 保存聚合根
   */
  async save(notification: Notification): Promise<void> {
    const db = getDatabase();
    const dto = notification.toPersistenceDTO();

    transaction(() => {
      const existing = db.prepare('SELECT uuid FROM notifications WHERE uuid = ?').get(dto.uuid);

      if (existing) {
        db.prepare(`
          UPDATE notifications SET
            account_uuid = ?, title = ?, content = ?, type = ?, category = ?,
            importance = ?, urgency = ?, status = ?, is_read = ?, read_at = ?,
            related_entity_type = ?, related_entity_uuid = ?, actions = ?, metadata = ?,
            expires_at = ?, updated_at = ?, sent_at = ?, delivered_at = ?, deleted_at = ?
          WHERE uuid = ?
        `).run(
          dto.accountUuid, dto.title, dto.content, dto.type, dto.category,
          dto.importance, dto.urgency, dto.status, dto.isRead ? 1 : 0, dto.readAt,
          dto.relatedEntityType, dto.relatedEntityUuid, dto.actions, dto.metadata,
          dto.expiresAt, dto.updatedAt, dto.sentAt, dto.deliveredAt, dto.deletedAt,
          dto.uuid
        );
      } else {
        db.prepare(`
          INSERT INTO notifications (
            uuid, account_uuid, title, content, type, category,
            importance, urgency, status, is_read, read_at,
            related_entity_type, related_entity_uuid, actions, metadata,
            expires_at, created_at, updated_at, sent_at, delivered_at, deleted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          dto.uuid, dto.accountUuid, dto.title, dto.content, dto.type, dto.category,
          dto.importance, dto.urgency, dto.status, dto.isRead ? 1 : 0, dto.readAt,
          dto.relatedEntityType, dto.relatedEntityUuid, dto.actions, dto.metadata,
          dto.expiresAt, dto.createdAt, dto.updatedAt, dto.sentAt, dto.deliveredAt, dto.deletedAt
        );
      }
    });
  }

  /**
   * 批量保存通知
   */
  async saveMany(notifications: Notification[]): Promise<void> {
    for (const notification of notifications) {
      await this.save(notification);
    }
  }

  /**
   * 通过 UUID 查找聚合根
   */
  async findById(uuid: string, _options?: { includeChildren?: boolean }): Promise<Notification | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM notifications WHERE uuid = ? AND deleted_at IS NULL').get(uuid) as NotificationRow | undefined;
    return row ? this.mapToEntity(row) : null;
  }

  /**
   * 通过账户 UUID 查找所有通知
   */
  async findByAccountUuid(
    accountUuid: string,
    options?: {
      includeChildren?: boolean;
      includeRead?: boolean;
      includeDeleted?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<Notification[]> {
    const db = getDatabase();
    let sql = 'SELECT * FROM notifications WHERE account_uuid = ?';
    const params: unknown[] = [accountUuid];

    if (!options?.includeDeleted) {
      sql += ' AND deleted_at IS NULL';
    }
    if (!options?.includeRead) {
      sql += ' AND is_read = 0';
    }
    sql += ' ORDER BY created_at DESC';

    if (options?.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
    }
    if (options?.offset) {
      sql += ' OFFSET ?';
      params.push(options.offset);
    }

    const rows = db.prepare(sql).all(...params) as NotificationRow[];
    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 通过状态查找通知
   */
  async findByStatus(
    accountUuid: string,
    status: NotificationStatus,
    options?: { limit?: number; offset?: number }
  ): Promise<Notification[]> {
    const db = getDatabase();
    let sql = 'SELECT * FROM notifications WHERE account_uuid = ? AND status = ? AND deleted_at IS NULL ORDER BY created_at DESC';
    const params: unknown[] = [accountUuid, status];

    if (options?.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
    }
    if (options?.offset) {
      sql += ' OFFSET ?';
      params.push(options.offset);
    }

    const rows = db.prepare(sql).all(...params) as NotificationRow[];
    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 通过分类查找通知
   */
  async findByCategory(
    accountUuid: string,
    category: NotificationCategory,
    options?: { limit?: number; offset?: number }
  ): Promise<Notification[]> {
    const db = getDatabase();
    let sql = 'SELECT * FROM notifications WHERE account_uuid = ? AND category = ? AND deleted_at IS NULL ORDER BY created_at DESC';
    const params: unknown[] = [accountUuid, category];

    if (options?.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
    }
    if (options?.offset) {
      sql += ' OFFSET ?';
      params.push(options.offset);
    }

    const rows = db.prepare(sql).all(...params) as NotificationRow[];
    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 查找未读通知
   */
  async findUnread(accountUuid: string, options?: { limit?: number }): Promise<Notification[]> {
    const db = getDatabase();
    let sql = 'SELECT * FROM notifications WHERE account_uuid = ? AND is_read = 0 AND deleted_at IS NULL ORDER BY created_at DESC';
    const params: unknown[] = [accountUuid];

    if (options?.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
    }

    const rows = db.prepare(sql).all(...params) as NotificationRow[];
    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 查找相关实体的通知
   */
  async findByRelatedEntity(
    relatedEntityType: string,
    relatedEntityUuid: string
  ): Promise<Notification[]> {
    const db = getDatabase();
    const rows = db.prepare(
      'SELECT * FROM notifications WHERE related_entity_type = ? AND related_entity_uuid = ? AND deleted_at IS NULL ORDER BY created_at DESC'
    ).all(relatedEntityType, relatedEntityUuid) as NotificationRow[];
    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 删除聚合根
   */
  async delete(uuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM notifications WHERE uuid = ?').run(uuid);
  }

  /**
   * 批量删除通知
   */
  async deleteMany(uuids: string[]): Promise<void> {
    const db = getDatabase();
    const placeholders = uuids.map(() => '?').join(',');
    db.prepare(`DELETE FROM notifications WHERE uuid IN (${placeholders})`).run(...uuids);
  }

  /**
   * 软删除通知
   */
  async softDelete(uuid: string): Promise<void> {
    const db = getDatabase();
    const now = Date.now();
    db.prepare('UPDATE notifications SET deleted_at = ?, updated_at = ? WHERE uuid = ?').run(now, now, uuid);
  }

  /**
   * 检查通知是否存在
   */
  async exists(uuid: string): Promise<boolean> {
    const db = getDatabase();
    const row = db.prepare('SELECT 1 FROM notifications WHERE uuid = ? AND deleted_at IS NULL').get(uuid);
    return !!row;
  }

  /**
   * 统计未读通知数量
   */
  async countUnread(accountUuid: string): Promise<number> {
    const db = getDatabase();
    const result = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE account_uuid = ? AND is_read = 0 AND deleted_at IS NULL').get(accountUuid) as { count: number };
    return result.count;
  }

  /**
   * 统计各分类通知数量
   */
  async countByCategory(accountUuid: string): Promise<Record<NotificationCategory, number>> {
    const db = getDatabase();
    const rows = db.prepare('SELECT category, COUNT(*) as count FROM notifications WHERE account_uuid = ? AND deleted_at IS NULL GROUP BY category').all(accountUuid) as { category: string; count: number }[];
    
    const result = {} as Record<NotificationCategory, number>;
    for (const row of rows) {
      result[row.category as NotificationCategory] = row.count;
    }
    return result;
  }

  /**
   * 批量标记为已读
   */
  async markManyAsRead(uuids: string[]): Promise<void> {
    const db = getDatabase();
    const now = Date.now();
    const placeholders = uuids.map(() => '?').join(',');
    db.prepare(`UPDATE notifications SET is_read = 1, read_at = ?, updated_at = ? WHERE uuid IN (${placeholders})`).run(now, now, ...uuids);
  }

  /**
   * 标记所有为已读
   */
  async markAllAsRead(accountUuid: string): Promise<void> {
    const db = getDatabase();
    const now = Date.now();
    db.prepare('UPDATE notifications SET is_read = 1, read_at = ?, updated_at = ? WHERE account_uuid = ? AND is_read = 0').run(now, now, accountUuid);
  }

  /**
   * 清理过期通知
   */
  async cleanupExpired(beforeTimestamp: number): Promise<number> {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM notifications WHERE expires_at IS NOT NULL AND expires_at < ?').run(beforeTimestamp);
    return result.changes;
  }

  /**
   * 清理已删除通知
   */
  async cleanupDeleted(beforeTimestamp: number): Promise<number> {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM notifications WHERE deleted_at IS NOT NULL AND deleted_at < ?').run(beforeTimestamp);
    return result.changes;
  }

  private mapToEntity(row: NotificationRow): Notification {
    return NotificationEntity.fromPersistenceDTO({
      uuid: row.uuid,
      accountUuid: row.account_uuid,
      title: row.title,
      content: row.content,
      type: row.type,
      category: row.category,
      importance: row.importance,
      urgency: row.urgency,
      status: row.status,
      isRead: row.is_read === 1,
      readAt: row.read_at,
      relatedEntityType: row.related_entity_type,
      relatedEntityUuid: row.related_entity_uuid,
      actions: row.actions,
      metadata: row.metadata,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      sentAt: row.sent_at,
      deliveredAt: row.delivered_at,
      deletedAt: row.deleted_at,
    });
  }
}
