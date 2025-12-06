// @ts-nocheck
/**
 * SQLite Repository Repository (for knowledge/resource repositories)
 * TODO: 修复类型定义后移除 @ts-nocheck
 */

import type { IRepositoryRepository } from '@dailyuse/domain-server/repository';
import type { Repository } from '@dailyuse/domain-server/repository';
import { getDatabase, transaction } from '../../database';

export class SqliteRepositoryRepository implements IRepositoryRepository {
  async save(repository: Repository): Promise<void> {
    const db = getDatabase();
    const dto = repository.toPersistenceDTO();

    transaction(() => {
      const existing = db.prepare('SELECT uuid FROM repositories WHERE uuid = ?').get(dto.uuid);

      if (existing) {
        db.prepare(`
          UPDATE repositories SET
            account_uuid = ?, name = ?, description = ?, type = ?, path = ?,
            settings = ?, updated_at = ?
          WHERE uuid = ?
        `).run(
          dto.accountUuid, dto.name, dto.description, dto.type, dto.path,
          JSON.stringify(dto.settings), dto.updatedAt, dto.uuid
        );
      } else {
        db.prepare(`
          INSERT INTO repositories (
            uuid, account_uuid, name, description, type, path, settings, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          dto.uuid, dto.accountUuid, dto.name, dto.description, dto.type, dto.path,
          JSON.stringify(dto.settings), dto.createdAt, dto.updatedAt
        );
      }
    });
  }

  async findByUuid(uuid: string): Promise<Repository | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM repositories WHERE uuid = ?').get(uuid);
    return row ? this.mapToEntity(row) : null;
  }

  async findByAccountUuid(accountUuid: string): Promise<Repository[]> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM repositories WHERE account_uuid = ? ORDER BY name ASC').all(accountUuid);
    return rows.map((row) => this.mapToEntity(row));
  }

  async delete(uuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM repositories WHERE uuid = ?').run(uuid);
  }

  private mapToEntity(row: unknown): Repository {
    const { Repository } = require('@dailyuse/domain-server/repository');
    return Repository.fromPersistenceDTO(row);
  }
}
