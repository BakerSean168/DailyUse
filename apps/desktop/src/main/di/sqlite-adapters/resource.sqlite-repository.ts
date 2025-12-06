// @ts-nocheck
/**
 * SQLite Resource Repository
 * TODO: 修复类型定义后移除 @ts-nocheck
 */

import type { IResourceRepository } from '@dailyuse/domain-server/repository';
import type { Resource } from '@dailyuse/domain-server/repository';
import { getDatabase, transaction } from '../../database';

export class SqliteResourceRepository implements IResourceRepository {
  async save(resource: Resource): Promise<void> {
    const db = getDatabase();
    const dto = resource.toPersistenceDTO();

    transaction(() => {
      const existing = db.prepare('SELECT uuid FROM resources WHERE uuid = ?').get(dto.uuid);

      if (existing) {
        db.prepare(`
          UPDATE resources SET
            repository_uuid = ?, folder_uuid = ?, name = ?, type = ?, path = ?,
            content = ?, metadata = ?, updated_at = ?
          WHERE uuid = ?
        `).run(
          dto.repositoryUuid, dto.folderUuid, dto.name, dto.type, dto.path,
          dto.content, JSON.stringify(dto.metadata), dto.updatedAt, dto.uuid
        );
      } else {
        db.prepare(`
          INSERT INTO resources (
            uuid, repository_uuid, folder_uuid, name, type, path, content, metadata, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          dto.uuid, dto.repositoryUuid, dto.folderUuid, dto.name, dto.type, dto.path,
          dto.content, JSON.stringify(dto.metadata), dto.createdAt, dto.updatedAt
        );
      }
    });
  }

  async findByUuid(uuid: string): Promise<Resource | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM resources WHERE uuid = ?').get(uuid);
    return row ? this.mapToEntity(row) : null;
  }

  async findByRepositoryUuid(repositoryUuid: string): Promise<Resource[]> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM resources WHERE repository_uuid = ? ORDER BY name ASC').all(repositoryUuid);
    return rows.map((row) => this.mapToEntity(row));
  }

  async findByFolderUuid(folderUuid: string): Promise<Resource[]> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM resources WHERE folder_uuid = ? ORDER BY name ASC').all(folderUuid);
    return rows.map((row) => this.mapToEntity(row));
  }

  async delete(uuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM resources WHERE uuid = ?').run(uuid);
  }

  private mapToEntity(row: unknown): Resource {
    const { Resource } = require('@dailyuse/domain-server/repository');
    return Resource.fromPersistenceDTO(row);
  }
}
