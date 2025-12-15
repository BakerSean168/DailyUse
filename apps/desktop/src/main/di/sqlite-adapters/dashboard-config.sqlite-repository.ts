/**
 * SQLite Dashboard Config Repository
 *
 * 实现 IDashboardConfigRepository 接口
 */

import type { IDashboardConfigRepository, DashboardConfig } from '@dailyuse/domain-server/dashboard';
import { DashboardConfig as DashboardConfigEntity } from '@dailyuse/domain-server/dashboard';
import { getDatabase, transaction } from '../../database';

interface DashboardConfigRow {
  id: number;
  account_uuid: string;
  widget_config: string;
  created_at: number;
  updated_at: number;
}

export class SqliteDashboardConfigRepository implements IDashboardConfigRepository {
  /**
   * 根据账户 UUID 查找配置
   */
  async findByAccountUuid(accountUuid: string): Promise<DashboardConfig | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM dashboard_configs WHERE account_uuid = ?').get(accountUuid) as DashboardConfigRow | undefined;
    return row ? this.mapToEntity(row) : null;
  }

  /**
   * 保存配置（新增或更新）
   */
  async save(config: DashboardConfig): Promise<DashboardConfig> {
    const db = getDatabase();
    const dto = config.toPersistence();

    transaction(() => {
      const existing = db.prepare('SELECT id FROM dashboard_configs WHERE account_uuid = ?').get(dto.accountUuid);

      if (existing) {
        db.prepare(`
          UPDATE dashboard_configs SET
            widget_config = ?, updated_at = ?
          WHERE account_uuid = ?
        `).run(
          dto.widgetConfig, Date.now(), dto.accountUuid
        );
      } else {
        db.prepare(`
          INSERT INTO dashboard_configs (account_uuid, widget_config, created_at, updated_at)
          VALUES (?, ?, ?, ?)
        `).run(
          dto.accountUuid, dto.widgetConfig, dto.createdAt, dto.updatedAt
        );
      }
    });

    return config;
  }

  /**
   * 删除配置
   */
  async delete(accountUuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM dashboard_configs WHERE account_uuid = ?').run(accountUuid);
  }

  /**
   * 检查配置是否存在
   */
  async exists(accountUuid: string): Promise<boolean> {
    const db = getDatabase();
    const row = db.prepare('SELECT 1 FROM dashboard_configs WHERE account_uuid = ?').get(accountUuid);
    return !!row;
  }

  private mapToEntity(row: DashboardConfigRow): DashboardConfig {
    return DashboardConfigEntity.fromPersistence({
      id: row.id,
      accountUuid: row.account_uuid,
      widgetConfig: row.widget_config,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
