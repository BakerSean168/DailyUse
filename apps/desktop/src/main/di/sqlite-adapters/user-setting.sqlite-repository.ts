// @ts-nocheck
/**
 * SQLite User Setting Repository
 * TODO: 修复类型定义后移除 @ts-nocheck
 */

import type { IUserSettingRepository } from '@dailyuse/domain-server/setting';
import type { UserSetting } from '@dailyuse/domain-server/setting';
import { getDatabase, transaction } from '../../database';

export class SqliteUserSettingRepository implements IUserSettingRepository {
  async save(userSetting: UserSetting): Promise<void> {
    const db = getDatabase();
    const dto = userSetting.toPersistenceDTO();

    transaction(() => {
      const existing = db.prepare('SELECT uuid FROM user_settings WHERE uuid = ?').get(dto.uuid);

      if (existing) {
        db.prepare(`
          UPDATE user_settings SET
            account_uuid = ?, setting_uuid = ?, value = ?, updated_at = ?
          WHERE uuid = ?
        `).run(dto.accountUuid, dto.settingUuid, dto.value, dto.updatedAt, dto.uuid);
      } else {
        db.prepare(`
          INSERT INTO user_settings (uuid, account_uuid, setting_uuid, value, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(dto.uuid, dto.accountUuid, dto.settingUuid, dto.value, dto.createdAt, dto.updatedAt);
      }
    });
  }

  async findByUuid(uuid: string): Promise<UserSetting | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM user_settings WHERE uuid = ?').get(uuid);
    return row ? this.mapToEntity(row) : null;
  }

  async findByAccountUuid(accountUuid: string): Promise<UserSetting[]> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM user_settings WHERE account_uuid = ?').all(accountUuid);
    return rows.map((row) => this.mapToEntity(row));
  }

  async findByAccountAndSetting(accountUuid: string, settingUuid: string): Promise<UserSetting | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM user_settings WHERE account_uuid = ? AND setting_uuid = ?').get(accountUuid, settingUuid);
    return row ? this.mapToEntity(row) : null;
  }

  async delete(uuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM user_settings WHERE uuid = ?').run(uuid);
  }

  async deleteByAccountUuid(accountUuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM user_settings WHERE account_uuid = ?').run(accountUuid);
  }

  private mapToEntity(row: unknown): UserSetting {
    const { UserSetting } = require('@dailyuse/domain-server/setting');
    return UserSetting.fromPersistenceDTO(row);
  }
}
