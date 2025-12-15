/**
 * SQLite Resource Repository
 *
 * 实现 IResourceRepository 接口
 */

import type { IResourceRepository, Resource } from '@dailyuse/domain-server/repository';
import { Resource as ResourceEntity } from '@dailyuse/domain-server/repository';
import { ResourceType, ResourceStatus } from '@dailyuse/contracts/repository';
import { getDatabase, transaction } from '../../database';

interface ResourceRow {
  uuid: string;
  repository_uuid: string;
  folder_uuid: string | null;
  name: string;
  type: string;
  path: string;
  size: number;
  content: string | null;
  metadata: string;
  stats: string;
  status: string;
  created_at: number;
  updated_at: number;
}

export class SqliteResourceRepository implements IResourceRepository {
  /**
   * 保存资源
   */
  async save(resource: Resource): Promise<void> {
    const db = getDatabase();
    const dto = resource.toPersistenceDTO();

    transaction(() => {
      const existing = db.prepare('SELECT uuid FROM resources WHERE uuid = ?').get(dto.uuid);

      if (existing) {
        db.prepare(`
          UPDATE resources SET
            repository_uuid = ?, folder_uuid = ?, name = ?, type = ?, path = ?,
            size = ?, content = ?, metadata = ?, stats = ?, status = ?, updated_at = ?
          WHERE uuid = ?
        `).run(
          dto.repository_uuid, dto.folder_uuid, dto.name, dto.type, dto.path,
          dto.size, dto.content, dto.metadata, dto.stats, dto.status, Date.now(),
          dto.uuid
        );
      } else {
        db.prepare(`
          INSERT INTO resources (
            uuid, repository_uuid, folder_uuid, name, type, path,
            size, content, metadata, stats, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          dto.uuid, dto.repository_uuid, dto.folder_uuid, dto.name, dto.type, dto.path,
          dto.size, dto.content, dto.metadata, dto.stats, dto.status,
          Date.now(), Date.now()
        );
      }
    });
  }

  /**
   * 根据 UUID 查找资源
   */
  async findByUuid(uuid: string): Promise<Resource | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM resources WHERE uuid = ?').get(uuid) as ResourceRow | undefined;
    return row ? this.mapToEntity(row) : null;
  }

  /**
   * 根据 ID 查找资源 (别名为 findByUuid)
   */
  async findById(uuid: string): Promise<Resource | null> {
    return this.findByUuid(uuid);
  }

  /**
   * 根据仓库 UUID 查找资源
   */
  async findByRepositoryUuid(repositoryUuid: string): Promise<Resource[]> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM resources WHERE repository_uuid = ? ORDER BY name ASC').all(repositoryUuid) as ResourceRow[];
    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 根据文件夹 UUID 查找资源
   */
  async findByFolderUuid(folderUuid: string): Promise<Resource[]> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM resources WHERE folder_uuid = ? ORDER BY name ASC').all(folderUuid) as ResourceRow[];
    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 根据账户 UUID 查找资源
   */
  async findByAccountUuid(accountUuid: string): Promise<Resource[]> {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT r.* FROM resources r
      JOIN repositories repo ON r.repository_uuid = repo.uuid
      WHERE repo.account_uuid = ?
      ORDER BY r.name ASC
    `).all(accountUuid) as ResourceRow[];
    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 检查路径是否已存在资源
   */
  async existsByPath(repositoryUuid: string, path: string): Promise<boolean> {
    const db = getDatabase();
    const row = db.prepare('SELECT 1 FROM resources WHERE repository_uuid = ? AND path = ?').get(repositoryUuid, path);
    return !!row;
  }

  /**
   * 删除资源
   */
  async delete(uuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM resources WHERE uuid = ?').run(uuid);
  }

  private mapToEntity(row: ResourceRow): Resource {
    return ResourceEntity.fromPersistenceDTO({
      uuid: row.uuid,
      repository_uuid: row.repository_uuid,
      folder_uuid: row.folder_uuid,
      name: row.name,
      type: row.type as ResourceType,
      path: row.path,
      size: row.size,
      content: row.content,
      metadata: row.metadata,
      stats: row.stats,
      status: row.status as ResourceStatus,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    });
  }
}
