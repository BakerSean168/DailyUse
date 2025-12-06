/**
 * SQLite ReminderGroup Repository
 *
 * 实现 IReminderGroupRepository 接口的 SQLite 适配器
 * 遵循 DDD Repository 模式
 */

import type { IReminderGroupRepository } from '@dailyuse/domain-server/reminder';
import { ReminderGroup } from '@dailyuse/domain-server/reminder';
import type { ReminderGroupPersistenceDTO } from '@dailyuse/contracts/reminder';
import { ControlMode, ReminderStatus } from '@dailyuse/contracts/reminder';
import { getDatabase, transaction } from '../../database';

/**
 * ReminderGroup SQLite Repository 实现
 */
export class SqliteReminderGroupRepository implements IReminderGroupRepository {
  // ============ 基本 CRUD ============

  /**
   * 保存聚合根（创建或更新）
   */
  async save(group: ReminderGroup): Promise<void> {
    const db = getDatabase();
    const dto = group.toPersistenceDTO();

    transaction(() => {
      const existing = db
        .prepare('SELECT uuid FROM reminder_groups WHERE uuid = ?')
        .get(dto.uuid);

      if (existing) {
        db.prepare(`
          UPDATE reminder_groups SET
            account_uuid = ?,
            name = ?,
            description = ?,
            control_mode = ?,
            enabled = ?,
            status = ?,
            "order" = ?,
            color = ?,
            icon = ?,
            stats = ?,
            updated_at = ?,
            deleted_at = ?
          WHERE uuid = ?
        `).run(
          dto.accountUuid,
          dto.name,
          dto.description,
          dto.control_mode,
          dto.enabled ? 1 : 0,
          dto.status,
          dto.order,
          dto.color,
          dto.icon,
          dto.stats,
          dto.updatedAt,
          dto.deletedAt,
          dto.uuid
        );
      } else {
        db.prepare(`
          INSERT INTO reminder_groups (
            uuid, account_uuid, name, description, control_mode,
            enabled, status, "order", color, icon, stats,
            created_at, updated_at, deleted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          dto.uuid,
          dto.accountUuid,
          dto.name,
          dto.description,
          dto.control_mode,
          dto.enabled ? 1 : 0,
          dto.status,
          dto.order,
          dto.color,
          dto.icon,
          dto.stats,
          dto.createdAt,
          dto.updatedAt,
          dto.deletedAt
        );
      }
    });
  }

  /**
   * 通过 UUID 查找聚合根
   */
  async findById(uuid: string): Promise<ReminderGroup | null> {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM reminder_groups WHERE uuid = ?')
      .get(uuid) as ReminderGroupRow | undefined;

    if (!row) {
      return null;
    }

    return this.mapToEntity(row);
  }

  /**
   * 通过账户 UUID 查找所有提醒分组
   */
  async findByAccountUuid(
    accountUuid: string,
    options?: { includeDeleted?: boolean }
  ): Promise<ReminderGroup[]> {
    const db = getDatabase();
    const includeDeleted = options?.includeDeleted ?? false;

    const query = includeDeleted
      ? 'SELECT * FROM reminder_groups WHERE account_uuid = ? ORDER BY "order" ASC, created_at ASC'
      : 'SELECT * FROM reminder_groups WHERE account_uuid = ? AND deleted_at IS NULL ORDER BY "order" ASC, created_at ASC';

    const rows = db.prepare(query).all(accountUuid) as ReminderGroupRow[];
    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 通过控制模式查找提醒分组
   */
  async findByControlMode(
    accountUuid: string,
    controlMode: ControlMode,
    options?: { includeDeleted?: boolean }
  ): Promise<ReminderGroup[]> {
    const db = getDatabase();
    const includeDeleted = options?.includeDeleted ?? false;

    const query = includeDeleted
      ? 'SELECT * FROM reminder_groups WHERE account_uuid = ? AND control_mode = ? ORDER BY "order" ASC'
      : 'SELECT * FROM reminder_groups WHERE account_uuid = ? AND control_mode = ? AND deleted_at IS NULL ORDER BY "order" ASC';

    const rows = db.prepare(query).all(accountUuid, controlMode) as ReminderGroupRow[];
    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 查找所有活跃的提醒分组
   */
  async findActive(accountUuid?: string): Promise<ReminderGroup[]> {
    const db = getDatabase();

    const query = accountUuid
      ? 'SELECT * FROM reminder_groups WHERE account_uuid = ? AND status = ? AND deleted_at IS NULL ORDER BY "order" ASC'
      : 'SELECT * FROM reminder_groups WHERE status = ? AND deleted_at IS NULL ORDER BY "order" ASC';

    const params = accountUuid
      ? [accountUuid, ReminderStatus.ACTIVE]
      : [ReminderStatus.ACTIVE];

    const rows = db.prepare(query).all(...params) as ReminderGroupRow[];
    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 批量查找提醒分组
   */
  async findByIds(uuids: string[]): Promise<ReminderGroup[]> {
    if (uuids.length === 0) {
      return [];
    }

    const db = getDatabase();
    const placeholders = uuids.map(() => '?').join(',');
    const query = `SELECT * FROM reminder_groups WHERE uuid IN (${placeholders})`;

    const rows = db.prepare(query).all(...uuids) as ReminderGroupRow[];
    const groups = rows.map((row) => this.mapToEntity(row));

    // 保持顺序与传入的 UUID 列表一致
    const groupMap = new Map(groups.map((g) => [g.uuid, g]));
    return uuids
      .map((uuid) => groupMap.get(uuid))
      .filter((g): g is ReminderGroup => g !== undefined);
  }

  /**
   * 通过名称查找分组
   */
  async findByName(
    accountUuid: string,
    name: string,
    excludeUuid?: string
  ): Promise<ReminderGroup | null> {
    const db = getDatabase();

    const query = excludeUuid
      ? 'SELECT * FROM reminder_groups WHERE account_uuid = ? AND name = ? AND uuid != ? AND deleted_at IS NULL'
      : 'SELECT * FROM reminder_groups WHERE account_uuid = ? AND name = ? AND deleted_at IS NULL';

    const params = excludeUuid
      ? [accountUuid, name, excludeUuid]
      : [accountUuid, name];

    const row = db.prepare(query).get(...params) as ReminderGroupRow | undefined;

    if (!row) {
      return null;
    }

    return this.mapToEntity(row);
  }

  /**
   * 删除聚合根
   */
  async delete(uuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM reminder_groups WHERE uuid = ?').run(uuid);
  }

  /**
   * 检查提醒分组是否存在
   */
  async exists(uuid: string): Promise<boolean> {
    const db = getDatabase();
    const row = db
      .prepare('SELECT 1 FROM reminder_groups WHERE uuid = ?')
      .get(uuid);
    return !!row;
  }

  /**
   * 统计账户下的提醒分组数量
   */
  async count(
    accountUuid: string,
    options?: { status?: ReminderStatus; includeDeleted?: boolean }
  ): Promise<number> {
    const db = getDatabase();
    const includeDeleted = options?.includeDeleted ?? false;

    let query = 'SELECT COUNT(*) as count FROM reminder_groups WHERE account_uuid = ?';
    const params: (string | ReminderStatus)[] = [accountUuid];

    if (options?.status) {
      query += ' AND status = ?';
      params.push(options.status);
    }

    if (!includeDeleted) {
      query += ' AND deleted_at IS NULL';
    }

    const row = db.prepare(query).get(...params) as { count: number };
    return row.count;
  }

  // ============ 私有方法 ============

  /**
   * 将数据库行映射为实体
   */
  private mapToEntity(row: ReminderGroupRow): ReminderGroup {
    return ReminderGroup.fromPersistenceDTO({
      uuid: row.uuid,
      accountUuid: row.account_uuid,
      name: row.name,
      description: row.description,
      control_mode: row.control_mode as ControlMode,
      enabled: !!row.enabled,
      status: row.status as ReminderStatus,
      order: row.order,
      color: row.color,
      icon: row.icon,
      stats: row.stats,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    });
  }
}

// ============ 类型定义 ============

interface ReminderGroupRow {
  uuid: string;
  account_uuid: string;
  name: string;
  description: string | null;
  control_mode: string;
  enabled: number;
  status: string;
  order: number;
  color: string | null;
  icon: string | null;
  stats: string;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}
