// @ts-nocheck
/**
 * SQLite Notification Preference Repository
 * TODO: 修复类型定义后移除 @ts-nocheck
 */

import type { INotificationPreferenceRepository } from '@dailyuse/domain-server/notification';
import type { NotificationPreference } from '@dailyuse/domain-server/notification';
import { getDatabase, transaction } from '../../database';

export class SqliteNotificationPreferenceRepository implements INotificationPreferenceRepository {
  async save(preference: NotificationPreference): Promise<void> {
    const db = getDatabase();
    const dto = preference.toPersistenceDTO();

    transaction(() => {
      const existing = db.prepare('SELECT uuid FROM notification_preferences WHERE uuid = ?').get(dto.uuid);

      if (existing) {
        db.prepare(`
          UPDATE notification_preferences SET
            account_uuid = ?, type = ?, enabled = ?, channels = ?, quiet_hours = ?, updated_at = ?
          WHERE uuid = ?
        `).run(
          dto.accountUuid, dto.type, dto.enabled ? 1 : 0, JSON.stringify(dto.channels),
          JSON.stringify(dto.quietHours), dto.updatedAt, dto.uuid
        );
      } else {
        db.prepare(`
          INSERT INTO notification_preferences (
            uuid, account_uuid, type, enabled, channels, quiet_hours, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          dto.uuid, dto.accountUuid, dto.type, dto.enabled ? 1 : 0,
          JSON.stringify(dto.channels), JSON.stringify(dto.quietHours), dto.createdAt, dto.updatedAt
        );
      }
    });
  }

  async findByUuid(uuid: string): Promise<NotificationPreference | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM notification_preferences WHERE uuid = ?').get(uuid);
    return row ? this.mapToEntity(row) : null;
  }

  async findByAccountUuid(accountUuid: string): Promise<NotificationPreference[]> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM notification_preferences WHERE account_uuid = ?').all(accountUuid);
    return rows.map((row) => this.mapToEntity(row));
  }

  async findByAccountAndType(accountUuid: string, type: string): Promise<NotificationPreference | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM notification_preferences WHERE account_uuid = ? AND type = ?').get(accountUuid, type);
    return row ? this.mapToEntity(row) : null;
  }

  async delete(uuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM notification_preferences WHERE uuid = ?').run(uuid);
  }

  private mapToEntity(row: unknown): NotificationPreference {
    const { NotificationPreference } = require('@dailyuse/domain-server/notification');
    return NotificationPreference.fromPersistenceDTO(row);
  }
}
