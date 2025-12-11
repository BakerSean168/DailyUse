/**
 * SQLite Setting Repository
 *
 * 实现 ISettingRepository 接口
 */

import type { ISettingRepository, Setting } from '@dailyuse/domain-server/setting';
import { SettingScope } from '@dailyuse/contracts/setting';
import { getDatabase, transaction } from '../../database';

interface SettingRow {
  uuid: string;
  key: string;
  name: string;
  description: string | null;
  value_type: string;
  value: string;
  default_value: string;
  scope: string;
  account_uuid: string | null;
  device_id: string | null;
  group_uuid: string | null;
  validation: string | null;
  ui: string | null;
  is_encrypted: number;
  is_read_only: number;
  is_system_setting: number;
  sync_config: string | null;
  history: string;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export class SqliteSettingRepository implements ISettingRepository {
  /**
   * 保存聚合根（创建或更新）
   */
  async save(setting: Setting): Promise<void> {
    const db = getDatabase();
    const dto = setting.toPersistenceDTO();

    transaction(() => {
      const existing = db.prepare('SELECT uuid FROM settings WHERE uuid = ?').get(dto.uuid);

      if (existing) {
        db.prepare(`
          UPDATE settings SET
            key = ?, name = ?, description = ?, value_type = ?, value = ?, default_value = ?,
            scope = ?, account_uuid = ?, device_id = ?, group_uuid = ?,
            validation = ?, ui = ?, is_encrypted = ?, is_read_only = ?, is_system_setting = ?,
            sync_config = ?, history = ?, updated_at = ?
          WHERE uuid = ?
        `).run(
          dto.key, dto.name, dto.description, dto.valueType, dto.value, dto.defaultValue,
          dto.scope, dto.accountUuid, dto.deviceId, dto.groupUuid,
          dto.validation, dto.ui, dto.isEncrypted ? 1 : 0, dto.isReadOnly ? 1 : 0, dto.isSystemSetting ? 1 : 0,
          dto.syncConfig, dto.history, dto.updatedAt,
          dto.uuid
        );
      } else {
        db.prepare(`
          INSERT INTO settings (
            uuid, key, name, description, value_type, value, default_value,
            scope, account_uuid, device_id, group_uuid,
            validation, ui, is_encrypted, is_read_only, is_system_setting,
            sync_config, history, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          dto.uuid, dto.key, dto.name, dto.description, dto.valueType, dto.value, dto.defaultValue,
          dto.scope, dto.accountUuid, dto.deviceId, dto.groupUuid,
          dto.validation, dto.ui, dto.isEncrypted ? 1 : 0, dto.isReadOnly ? 1 : 0, dto.isSystemSetting ? 1 : 0,
          dto.syncConfig, dto.history, dto.createdAt, dto.updatedAt
        );
      }
    });
  }

  /**
   * 通过 UUID 查找聚合根
   */
  async findById(uuid: string, _options?: { includeHistory?: boolean }): Promise<Setting | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM settings WHERE uuid = ? AND deleted_at IS NULL').get(uuid) as SettingRow | undefined;
    return row ? this.mapToEntity(row) : null;
  }

  /**
   * 通过 key 查找设置
   */
  async findByKey(key: string, scope: SettingScope, contextUuid?: string): Promise<Setting | null> {
    const db = getDatabase();
    let sql = 'SELECT * FROM settings WHERE key = ? AND scope = ? AND deleted_at IS NULL';
    const params: unknown[] = [key, scope];

    if (scope === SettingScope.USER && contextUuid) {
      sql += ' AND account_uuid = ?';
      params.push(contextUuid);
    } else if (scope === SettingScope.DEVICE && contextUuid) {
      sql += ' AND device_id = ?';
      params.push(contextUuid);
    }

    const row = db.prepare(sql).get(...params) as SettingRow | undefined;
    return row ? this.mapToEntity(row) : null;
  }

  /**
   * 按作用域查找所有设置
   */
  async findByScope(
    scope: SettingScope,
    contextUuid?: string,
    _options?: { includeHistory?: boolean }
  ): Promise<Setting[]> {
    const db = getDatabase();
    let sql = 'SELECT * FROM settings WHERE scope = ? AND deleted_at IS NULL';
    const params: unknown[] = [scope];

    if (scope === SettingScope.USER && contextUuid) {
      sql += ' AND account_uuid = ?';
      params.push(contextUuid);
    } else if (scope === SettingScope.DEVICE && contextUuid) {
      sql += ' AND device_id = ?';
      params.push(contextUuid);
    }

    const rows = db.prepare(sql).all(...params) as SettingRow[];
    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 按分组查找设置
   */
  async findByGroup(groupUuid: string, _options?: { includeHistory?: boolean }): Promise<Setting[]> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM settings WHERE group_uuid = ? AND deleted_at IS NULL').all(groupUuid) as SettingRow[];
    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 查找所有系统设置
   */
  async findSystemSettings(_options?: { includeHistory?: boolean }): Promise<Setting[]> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM settings WHERE scope = ? AND deleted_at IS NULL').all(SettingScope.SYSTEM) as SettingRow[];
    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 查找用户设置
   */
  async findUserSettings(accountUuid: string, _options?: { includeHistory?: boolean }): Promise<Setting[]> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM settings WHERE scope = ? AND account_uuid = ? AND deleted_at IS NULL').all(SettingScope.USER, accountUuid) as SettingRow[];
    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 查找设备设置
   */
  async findDeviceSettings(deviceId: string, _options?: { includeHistory?: boolean }): Promise<Setting[]> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM settings WHERE scope = ? AND device_id = ? AND deleted_at IS NULL').all(SettingScope.DEVICE, deviceId) as SettingRow[];
    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 删除聚合根（软删除）
   */
  async delete(uuid: string): Promise<void> {
    const db = getDatabase();
    const now = Date.now();
    db.prepare('UPDATE settings SET deleted_at = ?, updated_at = ? WHERE uuid = ?').run(now, now, uuid);
  }

  /**
   * 检查设置是否存在
   */
  async exists(uuid: string): Promise<boolean> {
    const db = getDatabase();
    const row = db.prepare('SELECT 1 FROM settings WHERE uuid = ? AND deleted_at IS NULL').get(uuid);
    return !!row;
  }

  /**
   * 检查 key 是否已被使用
   */
  async existsByKey(key: string, scope: SettingScope, contextUuid?: string): Promise<boolean> {
    const db = getDatabase();
    let sql = 'SELECT 1 FROM settings WHERE key = ? AND scope = ? AND deleted_at IS NULL';
    const params: unknown[] = [key, scope];

    if (scope === SettingScope.USER && contextUuid) {
      sql += ' AND account_uuid = ?';
      params.push(contextUuid);
    } else if (scope === SettingScope.DEVICE && contextUuid) {
      sql += ' AND device_id = ?';
      params.push(contextUuid);
    }

    const row = db.prepare(sql).get(...params);
    return !!row;
  }

  /**
   * 批量保存设置
   */
  async saveMany(settings: Setting[]): Promise<void> {
    for (const setting of settings) {
      await this.save(setting);
    }
  }

  /**
   * 搜索设置
   */
  async search(query: string, scope?: SettingScope): Promise<Setting[]> {
    const db = getDatabase();
    let sql = 'SELECT * FROM settings WHERE (key LIKE ? OR name LIKE ?) AND deleted_at IS NULL';
    const params: unknown[] = [`%${query}%`, `%${query}%`];

    if (scope) {
      sql += ' AND scope = ?';
      params.push(scope);
    }

    const rows = db.prepare(sql).all(...params) as SettingRow[];
    return rows.map((row) => this.mapToEntity(row));
  }

  private mapToEntity(row: SettingRow): Setting {
    return SettingEntity.fromPersistenceDTO({
      uuid: row.uuid,
      key: row.key,
      name: row.name,
      description: row.description,
      valueType: row.value_type,
      value: row.value,
      defaultValue: row.default_value,
      scope: row.scope,
      accountUuid: row.account_uuid,
      deviceId: row.device_id,
      groupUuid: row.group_uuid,
      validation: row.validation,
      ui: row.ui,
      isEncrypted: row.is_encrypted === 1,
      isReadOnly: row.is_read_only === 1,
      isSystemSetting: row.is_system_setting === 1,
      syncConfig: row.sync_config,
      history: row.history || '[]',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    });
  }
}
