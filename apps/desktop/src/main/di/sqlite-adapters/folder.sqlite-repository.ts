// @ts-nocheck
/**
 * SQLite Folder Repository
 * TODO: 修复类型定义后移除 @ts-nocheck
 */

import type { IFolderRepository } from '@dailyuse/domain-server/repository';
import type { Folder } from '@dailyuse/domain-server/repository';
import { getDatabase, transaction } from '../../database';

export class SqliteFolderRepository implements IFolderRepository {
  async save(folder: Folder): Promise<void> {
    const db = getDatabase();
    const dto = folder.toPersistenceDTO();

    transaction(() => {
      const existing = db.prepare('SELECT uuid FROM folders WHERE uuid = ?').get(dto.uuid);

      if (existing) {
        db.prepare(`
          UPDATE folders SET
            repository_uuid = ?, parent_uuid = ?, name = ?, path = ?, updated_at = ?
          WHERE uuid = ?
        `).run(
          dto.repositoryUuid, dto.parentUuid, dto.name, dto.path, dto.updatedAt, dto.uuid
        );
      } else {
        db.prepare(`
          INSERT INTO folders (
            uuid, repository_uuid, parent_uuid, name, path, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          dto.uuid, dto.repositoryUuid, dto.parentUuid, dto.name, dto.path, dto.createdAt, dto.updatedAt
        );
      }
    });
  }

  async findByUuid(uuid: string): Promise<Folder | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM folders WHERE uuid = ?').get(uuid);
    return row ? this.mapToEntity(row) : null;
  }

  async findByRepositoryUuid(repositoryUuid: string): Promise<Folder[]> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM folders WHERE repository_uuid = ? ORDER BY path ASC').all(repositoryUuid);
    return rows.map((row) => this.mapToEntity(row));
  }

  async findByParentUuid(parentUuid: string): Promise<Folder[]> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM folders WHERE parent_uuid = ? ORDER BY name ASC').all(parentUuid);
    return rows.map((row) => this.mapToEntity(row));
  }

  async delete(uuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM folders WHERE uuid = ?').run(uuid);
  }

  private mapToEntity(row: unknown): Folder {
    const { Folder } = require('@dailyuse/domain-server/repository');
    return Folder.fromPersistenceDTO(row);
  }
}
