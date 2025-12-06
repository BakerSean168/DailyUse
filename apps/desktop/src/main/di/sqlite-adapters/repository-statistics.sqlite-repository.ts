// @ts-nocheck
/**
 * SQLite Repository Statistics Repository
 * TODO: 修复类型定义后移除 @ts-nocheck
 */

import type { IRepositoryStatisticsRepository } from '@dailyuse/domain-server/repository';
import type { RepositoryStatistics } from '@dailyuse/domain-server/repository';
import { getDatabase, transaction } from '../../database';

export class SqliteRepositoryStatisticsRepository implements IRepositoryStatisticsRepository {
  async save(statistics: RepositoryStatistics): Promise<void> {
    const db = getDatabase();
    const dto = statistics.toPersistenceDTO();

    transaction(() => {
      const existing = db.prepare('SELECT uuid FROM repository_statistics WHERE uuid = ?').get(dto.uuid);

      if (existing) {
        db.prepare(`
          UPDATE repository_statistics SET
            repository_uuid = ?, total_resources = ?, total_folders = ?, total_size = ?,
            last_sync_at = ?, updated_at = ?
          WHERE uuid = ?
        `).run(
          dto.repositoryUuid, dto.totalResources, dto.totalFolders, dto.totalSize,
          dto.lastSyncAt, dto.updatedAt, dto.uuid
        );
      } else {
        db.prepare(`
          INSERT INTO repository_statistics (
            uuid, repository_uuid, total_resources, total_folders, total_size, last_sync_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          dto.uuid, dto.repositoryUuid, dto.totalResources, dto.totalFolders,
          dto.totalSize, dto.lastSyncAt, dto.createdAt, dto.updatedAt
        );
      }
    });
  }

  async findByUuid(uuid: string): Promise<RepositoryStatistics | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM repository_statistics WHERE uuid = ?').get(uuid);
    return row ? this.mapToEntity(row) : null;
  }

  async findByRepositoryUuid(repositoryUuid: string): Promise<RepositoryStatistics | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM repository_statistics WHERE repository_uuid = ?').get(repositoryUuid);
    return row ? this.mapToEntity(row) : null;
  }

  async delete(uuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM repository_statistics WHERE uuid = ?').run(uuid);
  }

  private mapToEntity(row: unknown): RepositoryStatistics {
    const { RepositoryStatistics } = require('@dailyuse/domain-server/repository');
    return RepositoryStatistics.fromPersistenceDTO(row);
  }
}
