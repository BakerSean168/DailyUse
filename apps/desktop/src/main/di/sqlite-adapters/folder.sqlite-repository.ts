/**
 * SQLite Folder Repository
 *
 * 实现 IFolderRepository 接口
 */

import type { IFolderRepository, Folder } from '@dailyuse/domain-server/repository';
import { getDatabase, transaction } from '../../database';

interface FolderRow {
  uuid: string;
  repository_uuid: string;
  parent_uuid: string | null;
  name: string;
  path: string;
  order: number;
  is_expanded: number;
  metadata: string;
  created_at: number;
  updated_at: number;
}

export class SqliteFolderRepository implements IFolderRepository {
  /**
   * 保存文件夹
   */
  async save(folder: Folder): Promise<void> {
    const db = getDatabase();
    const dto = folder.toPersistenceDTO();

    transaction(() => {
      const existing = db.prepare('SELECT uuid FROM folders WHERE uuid = ?').get(dto.uuid);

      if (existing) {
        db.prepare(`
          UPDATE folders SET
            repository_uuid = ?, parent_uuid = ?, name = ?, path = ?,
            order_num = ?, is_expanded = ?, metadata = ?, updated_at = ?
          WHERE uuid = ?
        `).run(
          dto.repositoryUuid, dto.parentUuid, dto.name, dto.path,
          dto.order, dto.isExpanded ? 1 : 0, dto.metadata, Date.now(),
          dto.uuid
        );
      } else {
        db.prepare(`
          INSERT INTO folders (
            uuid, repository_uuid, parent_uuid, name, path,
            order_num, is_expanded, metadata, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          dto.uuid, dto.repositoryUuid, dto.parentUuid, dto.name, dto.path,
          dto.order, dto.isExpanded ? 1 : 0, dto.metadata, dto.createdAt, dto.updatedAt
        );
      }
    });
  }

  /**
   * 根据 UUID 查找文件夹
   */
  async findByUuid(uuid: string): Promise<Folder | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM folders WHERE uuid = ?').get(uuid) as FolderRow | undefined;
    return row ? this.mapToEntity(row) : null;
  }

  /**
   * 根据仓库 UUID 查找所有文件夹
   */
  async findByRepositoryUuid(repositoryUuid: string): Promise<Folder[]> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM folders WHERE repository_uuid = ? ORDER BY path ASC').all(repositoryUuid) as FolderRow[];
    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 根据父文件夹 UUID 查找子文件夹
   */
  async findByParentUuid(parentUuid: string): Promise<Folder[]> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM folders WHERE parent_uuid = ? ORDER BY order_num ASC, name ASC').all(parentUuid) as FolderRow[];
    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 查找根文件夹
   */
  async findRootFolders(repositoryUuid: string): Promise<Folder[]> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM folders WHERE repository_uuid = ? AND parent_uuid IS NULL ORDER BY order_num ASC, name ASC').all(repositoryUuid) as FolderRow[];
    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 删除文件夹
   */
  async delete(uuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM folders WHERE uuid = ?').run(uuid);
  }

  /**
   * 根据仓库 UUID 删除所有文件夹
   */
  async deleteByRepositoryUuid(repositoryUuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM folders WHERE repository_uuid = ?').run(repositoryUuid);
  }

  /**
   * 检查文件夹是否存在
   */
  async exists(uuid: string): Promise<boolean> {
    const db = getDatabase();
    const row = db.prepare('SELECT 1 FROM folders WHERE uuid = ?').get(uuid);
    return !!row;
  }

  private mapToEntity(row: FolderRow): Folder {
    const { Folder } = require('@dailyuse/domain-server/repository');
    return Folder.fromPersistenceDTO({
      uuid: row.uuid,
      repositoryUuid: row.repository_uuid,
      parentUuid: row.parent_uuid,
      name: row.name,
      path: row.path,
      order: row.order,
      isExpanded: row.is_expanded === 1,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
