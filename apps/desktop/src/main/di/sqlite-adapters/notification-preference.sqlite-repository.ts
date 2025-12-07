/**
 * SQLite Notification Preference Repository
 *
 * 实现 INotificationPreferenceRepository 接口
 */

import type { INotificationPreferenceRepository, NotificationPreference } from '@dailyuse/domain-server/notification';
import { getDatabase, transaction } from '../../database';

interface NotificationPreferenceRow {
  uuid: string;
  account_uuid: string;
  enabled: number;
  channels: string;
  categories: string;
  do_not_disturb: string | null;
  rate_limit: string | null;
  created_at: number;
  updated_at: number;
}

export class SqliteNotificationPreferenceRepository implements INotificationPreferenceRepository {
  /**
   * 保存偏好设置（创建或更新）
   */
  async save(preference: NotificationPreference): Promise<void> {
    const db = getDatabase();
    const dto = preference.toPersistenceDTO();

    transaction(() => {
      const existing = db.prepare('SELECT uuid FROM notification_preferences WHERE uuid = ?').get(dto.uuid);

      if (existing) {
        db.prepare(`
          UPDATE notification_preferences SET
            account_uuid = ?, enabled = ?, channels = ?, categories = ?,
            do_not_disturb = ?, rate_limit = ?, updated_at = ?
          WHERE uuid = ?
        `).run(
          dto.accountUuid, dto.enabled ? 1 : 0, dto.channels, dto.categories,
          dto.doNotDisturb, dto.rateLimit, dto.updatedAt, dto.uuid
        );
      } else {
        db.prepare(`
          INSERT INTO notification_preferences (
            uuid, account_uuid, enabled, channels, categories,
            do_not_disturb, rate_limit, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          dto.uuid, dto.accountUuid, dto.enabled ? 1 : 0, dto.channels, dto.categories,
          dto.doNotDisturb, dto.rateLimit, dto.createdAt, dto.updatedAt
        );
      }
    });
  }

  /**
   * 通过 UUID 查找偏好设置
   */
  async findById(uuid: string): Promise<NotificationPreference | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM notification_preferences WHERE uuid = ?').get(uuid) as NotificationPreferenceRow | undefined;
    return row ? this.mapToEntity(row) : null;
  }

  /**
   * 通过账户 UUID 查找偏好设置（返回单个）
   */
  async findByAccountUuid(accountUuid: string): Promise<NotificationPreference | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM notification_preferences WHERE account_uuid = ?').get(accountUuid) as NotificationPreferenceRow | undefined;
    return row ? this.mapToEntity(row) : null;
  }

  /**
   * 删除偏好设置
   */
  async delete(uuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM notification_preferences WHERE uuid = ?').run(uuid);
  }

  /**
   * 检查偏好设置是否存在
   */
  async exists(uuid: string): Promise<boolean> {
    const db = getDatabase();
    const row = db.prepare('SELECT 1 FROM notification_preferences WHERE uuid = ?').get(uuid);
    return !!row;
  }

  /**
   * 检查账户是否已有偏好设置
   */
  async existsForAccount(accountUuid: string): Promise<boolean> {
    const db = getDatabase();
    const row = db.prepare('SELECT 1 FROM notification_preferences WHERE account_uuid = ?').get(accountUuid);
    return !!row;
  }

  /**
   * 获取或创建偏好设置
   */
  async getOrCreate(accountUuid: string): Promise<NotificationPreference> {
    const existing = await this.findByAccountUuid(accountUuid);
    if (existing) {
      return existing;
    }

    // 创建默认偏好设置
    const { NotificationPreference } = require('@dailyuse/domain-server/notification');
    const defaultPreference = NotificationPreference.create({ accountUuid });
    await this.save(defaultPreference);
    return defaultPreference;
  }

  private mapToEntity(row: NotificationPreferenceRow): NotificationPreference {
    const { NotificationPreference } = require('@dailyuse/domain-server/notification');
    return NotificationPreference.fromPersistenceDTO({
      uuid: row.uuid,
      accountUuid: row.account_uuid,
      enabled: row.enabled === 1,
      channels: row.channels,
      categories: row.categories,
      doNotDisturb: row.do_not_disturb,
      rateLimit: row.rate_limit,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
