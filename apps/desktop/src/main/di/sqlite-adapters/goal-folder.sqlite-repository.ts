/**
 * SQLite Goal Folder Repository
 *
 * 实现 IGoalFolderRepository 接口的 SQLite 适配器
 */

import type { IGoalFolderRepository } from '@dailyuse/domain-server/goal';
import { FolderType } from '@dailyuse/contracts/goal';
import { GoalFolder } from '@dailyuse/domain-server/goal';
import { getDatabase } from '../../database';

/**
 * GoalFolder SQLite Repository 实现
 */
export class SqliteGoalFolderRepository implements IGoalFolderRepository {
  /**
   * 保存文件夹
   */
  async save(folder: GoalFolder): Promise<void> {
    const db = getDatabase();
    const dto = folder.toPersistenceDTO();

    const existing = db
      .prepare('SELECT uuid FROM goal_folders WHERE uuid = ?')
      .get(dto.uuid);

    if (existing) {
      db.prepare(`
        UPDATE goal_folders SET
          account_uuid = ?,
          name = ?,
          color = ?,
          icon = ?,
          sort_order = ?,
          updated_at = ?
        WHERE uuid = ?
      `).run(
        dto.accountUuid,
        dto.name,
        dto.color,
        dto.icon,
        dto.sortOrder,
        dto.updatedAt,
        dto.uuid
      );
    } else {
      db.prepare(`
        INSERT INTO goal_folders (
          uuid, account_uuid, name, color, icon, sort_order, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        dto.uuid,
        dto.accountUuid,
        dto.name,
        dto.color,
        dto.icon,
        dto.sortOrder,
        dto.createdAt,
        dto.updatedAt
      );
    }
  }

  /**
   * 通过 UUID 查找文件夹
   */
  async findById(uuid: string): Promise<GoalFolder | null> {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM goal_folders WHERE uuid = ?')
      .get(uuid) as GoalFolderRow | undefined;

    if (!row) {
      return null;
    }

    return this.mapToEntity(row);
  }

  /**
   * 通过账户 UUID 查找所有文件夹
   */
  async findByAccountUuid(accountUuid: string): Promise<GoalFolder[]> {
    const db = getDatabase();
    const rows = db
      .prepare(
        'SELECT * FROM goal_folders WHERE account_uuid = ? ORDER BY sort_order ASC'
      )
      .all(accountUuid) as GoalFolderRow[];

    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 删除文件夹
   */
  async delete(uuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM goal_folders WHERE uuid = ?').run(uuid);
  }

  /**
   * 检查文件夹是否存在
   */
  async exists(uuid: string): Promise<boolean> {
    const db = getDatabase();
    const row = db
      .prepare('SELECT 1 FROM goal_folders WHERE uuid = ?')
      .get(uuid);
    return !!row;
  }

  private mapToEntity(row: GoalFolderRow): GoalFolder {
    return GoalFolder.fromPersistenceDTO({
      uuid: row.uuid,
      accountUuid: row.account_uuid,
      name: row.name,
      description: row.description,
      color: row.color,
      icon: row.icon,
      parentFolderUuid: row.parent_folder_uuid,
      sortOrder: row.sort_order,
      isSystemFolder: row.is_system_folder ?? false,
      folderType: row.folder_type as FolderType | null,
      goalCount: row.goal_count ?? 0,
      completedGoalCount: row.completed_goal_count ?? 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    });
  }
}

interface GoalFolderRow {
  uuid: string;
  account_uuid: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  parent_folder_uuid: string | null;
  sort_order: number;
  is_system_folder: boolean;
  folder_type: string | null;
  goal_count: number;
  completed_goal_count: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}
