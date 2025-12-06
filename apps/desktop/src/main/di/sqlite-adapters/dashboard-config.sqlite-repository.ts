// @ts-nocheck
/**
 * SQLite Dashboard Config Repository
 * TODO: 修复类型定义后移除 @ts-nocheck
 */

import type { IDashboardConfigRepository } from '@dailyuse/domain-server/dashboard';
import type { DashboardConfig } from '@dailyuse/domain-server/dashboard';
import { getDatabase, transaction } from '../../database';

export class SqliteDashboardConfigRepository implements IDashboardConfigRepository {
  async save(config: DashboardConfig): Promise<void> {
    const db = getDatabase();
    const dto = config.toPersistenceDTO();

    transaction(() => {
      const existing = db.prepare('SELECT uuid FROM dashboard_configs WHERE uuid = ?').get(dto.uuid);

      if (existing) {
        db.prepare(`
          UPDATE dashboard_configs SET
            account_uuid = ?, name = ?, layout = ?, widgets = ?, theme = ?,
            is_default = ?, updated_at = ?
          WHERE uuid = ?
        `).run(
          dto.accountUuid, dto.name, JSON.stringify(dto.layout), JSON.stringify(dto.widgets),
          dto.theme, dto.isDefault ? 1 : 0, dto.updatedAt, dto.uuid
        );
      } else {
        db.prepare(`
          INSERT INTO dashboard_configs (
            uuid, account_uuid, name, layout, widgets, theme, is_default, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          dto.uuid, dto.accountUuid, dto.name, JSON.stringify(dto.layout),
          JSON.stringify(dto.widgets), dto.theme, dto.isDefault ? 1 : 0, dto.createdAt, dto.updatedAt
        );
      }
    });
  }

  async findByUuid(uuid: string): Promise<DashboardConfig | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM dashboard_configs WHERE uuid = ?').get(uuid);
    return row ? this.mapToEntity(row) : null;
  }

  async findByAccountUuid(accountUuid: string): Promise<DashboardConfig[]> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM dashboard_configs WHERE account_uuid = ? ORDER BY name ASC').all(accountUuid);
    return rows.map((row) => this.mapToEntity(row));
  }

  async findDefault(accountUuid: string): Promise<DashboardConfig | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM dashboard_configs WHERE account_uuid = ? AND is_default = 1').get(accountUuid);
    return row ? this.mapToEntity(row) : null;
  }

  async delete(uuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM dashboard_configs WHERE uuid = ?').run(uuid);
  }

  async setDefault(accountUuid: string, uuid: string): Promise<void> {
    const db = getDatabase();
    transaction(() => {
      db.prepare('UPDATE dashboard_configs SET is_default = 0 WHERE account_uuid = ?').run(accountUuid);
      db.prepare('UPDATE dashboard_configs SET is_default = 1 WHERE uuid = ?').run(uuid);
    });
  }

  private mapToEntity(row: unknown): DashboardConfig {
    const { DashboardConfig } = require('@dailyuse/domain-server/dashboard');
    return DashboardConfig.fromPersistenceDTO(row);
  }
}
