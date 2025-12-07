/**
 * SQLite App Config Repository
 *
 * 实现 IAppConfigRepository 接口
 */

import type { IAppConfigRepository } from '@dailyuse/domain-server/setting';
import { getDatabase, transaction } from '../../database';

interface AppConfigRow {
  uuid: string;
  version: string;
  config_data: string;
  is_current: number;
  created_at: number;
  updated_at: number;
}

// 使用 any 因为 AppConfig 聚合根尚未定义完整类型
type AppConfig = any;

export class SqliteAppConfigRepository implements IAppConfigRepository {
  /**
   * 保存应用配置（创建或更新）
   */
  async save(config: AppConfig): Promise<void> {
    const db = getDatabase();

    transaction(() => {
      // 如果设置为当前配置，先取消其他配置的 current 状态
      if (config.isCurrent) {
        db.prepare('UPDATE app_configs SET is_current = 0 WHERE is_current = 1').run();
      }

      const existing = db.prepare('SELECT uuid FROM app_configs WHERE uuid = ?').get(config.uuid);

      if (existing) {
        db.prepare(`
          UPDATE app_configs SET
            version = ?, config_data = ?, is_current = ?, updated_at = ?
          WHERE uuid = ?
        `).run(
          config.version,
          JSON.stringify(config.data ?? {}),
          config.isCurrent ? 1 : 0,
          Date.now(),
          config.uuid
        );
      } else {
        db.prepare(`
          INSERT INTO app_configs (uuid, version, config_data, is_current, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          config.uuid,
          config.version,
          JSON.stringify(config.data ?? {}),
          config.isCurrent ? 1 : 0,
          Date.now(),
          Date.now()
        );
      }
    });
  }

  /**
   * 通过 UUID 查找应用配置
   */
  async findById(uuid: string): Promise<AppConfig | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM app_configs WHERE uuid = ?').get(uuid) as AppConfigRow | undefined;
    return row ? this.mapToEntity(row) : null;
  }

  /**
   * 获取当前应用配置
   */
  async getCurrent(): Promise<AppConfig | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM app_configs WHERE is_current = 1').get() as AppConfigRow | undefined;
    return row ? this.mapToEntity(row) : null;
  }

  /**
   * 通过版本号查找配置
   */
  async findByVersion(version: string): Promise<AppConfig | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM app_configs WHERE version = ?').get(version) as AppConfigRow | undefined;
    return row ? this.mapToEntity(row) : null;
  }

  /**
   * 获取所有历史版本（按时间倒序）
   */
  async findAllVersions(): Promise<AppConfig[]> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM app_configs ORDER BY created_at DESC').all() as AppConfigRow[];
    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 删除配置
   */
  async delete(uuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM app_configs WHERE uuid = ?').run(uuid);
  }

  /**
   * 检查配置是否存在
   */
  async exists(uuid: string): Promise<boolean> {
    const db = getDatabase();
    const row = db.prepare('SELECT 1 FROM app_configs WHERE uuid = ?').get(uuid);
    return !!row;
  }

  /**
   * 检查版本是否存在
   */
  async existsByVersion(version: string): Promise<boolean> {
    const db = getDatabase();
    const row = db.prepare('SELECT 1 FROM app_configs WHERE version = ?').get(version);
    return !!row;
  }

  private mapToEntity(row: AppConfigRow): AppConfig {
    return {
      uuid: row.uuid,
      version: row.version,
      data: JSON.parse(row.config_data || '{}'),
      isCurrent: row.is_current === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
