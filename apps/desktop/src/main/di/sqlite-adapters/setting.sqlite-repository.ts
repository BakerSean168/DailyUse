// @ts-nocheck
/**
 * SQLite Setting Repository
 * TODO: 修复类型定义后移除 @ts-nocheck
 */

import type { ISettingRepository } from '@dailyuse/domain-server/setting';
import type { Setting } from '@dailyuse/domain-server/setting';
import { getDatabase, transaction } from '../../database';

export class SqliteSettingRepository implements ISettingRepository {
  async save(setting: Setting): Promise<void> {
    const db = getDatabase();
    const dto = setting.toPersistenceDTO();

    transaction(() => {
      const existing = db.prepare('SELECT uuid FROM settings WHERE uuid = ?').get(dto.uuid);

      if (existing) {
        db.prepare(`
          UPDATE settings SET
            category = ?, key = ?, value = ?, type = ?, label = ?, description = ?,
            options = ?, default_value = ?, updated_at = ?
          WHERE uuid = ?
        `).run(
          dto.category, dto.key, dto.value, dto.type, dto.label, dto.description,
          JSON.stringify(dto.options), dto.defaultValue, dto.updatedAt, dto.uuid
        );
      } else {
        db.prepare(`
          INSERT INTO settings (
            uuid, category, key, value, type, label, description, options, default_value, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          dto.uuid, dto.category, dto.key, dto.value, dto.type, dto.label, dto.description,
          JSON.stringify(dto.options), dto.defaultValue, dto.createdAt, dto.updatedAt
        );
      }
    });
  }

  async findByUuid(uuid: string): Promise<Setting | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM settings WHERE uuid = ?').get(uuid);
    return row ? this.mapToEntity(row) : null;
  }

  async findByKey(key: string): Promise<Setting | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM settings WHERE key = ?').get(key);
    return row ? this.mapToEntity(row) : null;
  }

  async findByCategory(category: string): Promise<Setting[]> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM settings WHERE category = ? ORDER BY key ASC').all(category);
    return rows.map((row) => this.mapToEntity(row));
  }

  async findAll(): Promise<Setting[]> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM settings ORDER BY category ASC, key ASC').all();
    return rows.map((row) => this.mapToEntity(row));
  }

  async delete(uuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM settings WHERE uuid = ?').run(uuid);
  }

  private mapToEntity(row: unknown): Setting {
    const { Setting } = require('@dailyuse/domain-server/setting');
    return Setting.fromPersistenceDTO(row);
  }
}
