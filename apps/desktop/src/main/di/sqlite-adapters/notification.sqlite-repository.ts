// @ts-nocheck
/**
 * SQLite Notification Repository
 * TODO: 修复类型定义后移除 @ts-nocheck
 */

import type { INotificationRepository } from '@dailyuse/domain-server/notification';
import type { Notification } from '@dailyuse/domain-server/notification';
import { getDatabase, transaction } from '../../database';

export class SqliteNotificationRepository implements INotificationRepository {
  async save(notification: Notification): Promise<void> {
    const db = getDatabase();
    const dto = notification.toPersistenceDTO();

    transaction(() => {
      const existing = db.prepare('SELECT uuid FROM notifications WHERE uuid = ?').get(dto.uuid);

      if (existing) {
        db.prepare(`
          UPDATE notifications SET
            account_uuid = ?, type = ?, title = ?, content = ?, data = ?,
            read = ?, read_at = ?, sent_at = ?, updated_at = ?
          WHERE uuid = ?
        `).run(
          dto.accountUuid, dto.type, dto.title, dto.content, JSON.stringify(dto.data),
          dto.read ? 1 : 0, dto.readAt, dto.sentAt, dto.updatedAt, dto.uuid
        );
      } else {
        db.prepare(`
          INSERT INTO notifications (
            uuid, account_uuid, type, title, content, data, read, read_at, sent_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          dto.uuid, dto.accountUuid, dto.type, dto.title, dto.content,
          JSON.stringify(dto.data), dto.read ? 1 : 0, dto.readAt, dto.sentAt, dto.createdAt, dto.updatedAt
        );
      }
    });
  }

  async findByUuid(uuid: string): Promise<Notification | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM notifications WHERE uuid = ?').get(uuid);
    return row ? this.mapToEntity(row) : null;
  }

  async findByAccountUuid(accountUuid: string, options?: { limit?: number; offset?: number }): Promise<Notification[]> {
    const db = getDatabase();
    let query = 'SELECT * FROM notifications WHERE account_uuid = ? ORDER BY created_at DESC';
    const params: unknown[] = [accountUuid];

    if (options?.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }
    if (options?.offset) {
      query += ' OFFSET ?';
      params.push(options.offset);
    }

    const rows = db.prepare(query).all(...params);
    return rows.map((row) => this.mapToEntity(row));
  }

  async findUnread(accountUuid: string): Promise<Notification[]> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM notifications WHERE account_uuid = ? AND read = 0 ORDER BY created_at DESC').all(accountUuid);
    return rows.map((row) => this.mapToEntity(row));
  }

  async countUnread(accountUuid: string): Promise<number> {
    const db = getDatabase();
    const result = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE account_uuid = ? AND read = 0').get(accountUuid) as { count: number };
    return result.count;
  }

  async markAsRead(uuid: string): Promise<void> {
    const db = getDatabase();
    const now = Date.now();
    db.prepare('UPDATE notifications SET read = 1, read_at = ?, updated_at = ? WHERE uuid = ?').run(now, now, uuid);
  }

  async markAllAsRead(accountUuid: string): Promise<void> {
    const db = getDatabase();
    const now = Date.now();
    db.prepare('UPDATE notifications SET read = 1, read_at = ?, updated_at = ? WHERE account_uuid = ? AND read = 0').run(now, now, accountUuid);
  }

  async delete(uuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM notifications WHERE uuid = ?').run(uuid);
  }

  async deleteByAccountUuid(accountUuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM notifications WHERE account_uuid = ?').run(accountUuid);
  }

  private mapToEntity(row: unknown): Notification {
    const { Notification } = require('@dailyuse/domain-server/notification');
    return Notification.fromPersistenceDTO(row);
  }
}
