// @ts-nocheck
/**
 * SQLite App Config Repository
 * TODO: 修复类型定义后移除 @ts-nocheck
 */

import type { IAppConfigRepository } from '@dailyuse/domain-server/setting';
import type { AppConfig } from '@dailyuse/domain-server/setting';
import { getDatabase, transaction } from '../../database';

export class SqliteAppConfigRepository implements IAppConfigRepository {
  async save(config: AppConfig): Promise<void> {
    const db = getDatabase();
    const dto = config.toPersistenceDTO();

    transaction(() => {
      const existing = db.prepare('SELECT uuid FROM app_configs WHERE uuid = ?').get(dto.uuid);

      if (existing) {
        db.prepare(`
          UPDATE app_configs SET
            key = ?, value = ?, type = ?, description = ?, updated_at = ?
          WHERE uuid = ?
        `).run(dto.key, dto.value, dto.type, dto.description, dto.updatedAt, dto.uuid);
      } else {
        db.prepare(`
          INSERT INTO app_configs (uuid, key, value, type, description, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(dto.uuid, dto.key, dto.value, dto.type, dto.description, dto.createdAt, dto.updatedAt);
      }
    });
  }

  async findByUuid(uuid: string): Promise<AppConfig | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM app_configs WHERE uuid = ?').get(uuid);
    return row ? this.mapToEntity(row) : null;
  }

  async findByKey(key: string): Promise<AppConfig | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM app_configs WHERE key = ?').get(key);
    return row ? this.mapToEntity(row) : null;
  }

  async findAll(): Promise<AppConfig[]> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM app_configs ORDER BY key ASC').all();
    return rows.map((row) => this.mapToEntity(row));
  }

  async delete(uuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM app_configs WHERE uuid = ?').run(uuid);
  }

  private mapToEntity(row: unknown): AppConfig {
    const { AppConfig } = require('@dailyuse/domain-server/setting');
    return AppConfig.fromPersistenceDTO(row);
  }
}
