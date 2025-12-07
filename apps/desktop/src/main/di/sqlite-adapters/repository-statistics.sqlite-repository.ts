/**
 * SQLite Repository Statistics Repository
 */

import type { IRepositoryStatisticsRepository } from '@dailyuse/domain-server/repository';
import type { RepositoryStatistics } from '@dailyuse/domain-server/repository';
import type { RepositoryStatisticsPersistenceDTO } from '@dailyuse/contracts/repository';
import { getDatabase, transaction } from '../../database';

/** 数据库行类型 */
interface RepositoryStatisticsRow {
  uuid: string;
  account_uuid: string;
  total_repositories: number;
  active_repositories: number;
  archived_repositories: number;
  total_resources: number;
  total_folders: number;
  total_tags: number;
  total_storage_bytes: number;
  last_updated_at: number;
  created_at: number;
  updated_at: number;
}

export class SqliteRepositoryStatisticsRepository implements IRepositoryStatisticsRepository {
  async save(statistics: RepositoryStatistics): Promise<void> {
    const db = getDatabase();
    const dto = statistics.toPersistence();

    transaction(() => {
      const existing = db.prepare('SELECT uuid FROM repository_statistics WHERE uuid = ?').get(dto.uuid) as { uuid: string } | undefined;

      if (existing) {
        db.prepare(`
          UPDATE repository_statistics SET
            account_uuid = ?, total_repositories = ?, active_repositories = ?, archived_repositories = ?,
            total_resources = ?, total_folders = ?, total_tags = ?, total_storage_bytes = ?,
            last_updated_at = ?, updated_at = ?
          WHERE uuid = ?
        `).run(
          dto.accountUuid, dto.totalRepositories, dto.activeRepositories, dto.archivedRepositories,
          dto.totalResources, dto.totalFolders, dto.totalTags, dto.totalStorageBytes,
          dto.lastUpdatedAt, dto.updatedAt, dto.uuid
        );
      } else {
        db.prepare(`
          INSERT INTO repository_statistics (
            uuid, account_uuid, total_repositories, active_repositories, archived_repositories,
            total_resources, total_folders, total_tags, total_storage_bytes,
            last_updated_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          dto.uuid, dto.accountUuid, dto.totalRepositories, dto.activeRepositories, dto.archivedRepositories,
          dto.totalResources, dto.totalFolders, dto.totalTags, dto.totalStorageBytes,
          dto.lastUpdatedAt, dto.createdAt, dto.updatedAt
        );
      }
    });
  }

  async findByAccountUuid(accountUuid: string): Promise<RepositoryStatistics | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM repository_statistics WHERE account_uuid = ?').get(accountUuid) as RepositoryStatisticsRow | undefined;
    return row ? this.mapToEntity(row) : null;
  }

  async findByUuid(uuid: string): Promise<RepositoryStatistics | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM repository_statistics WHERE uuid = ?').get(uuid) as RepositoryStatisticsRow | undefined;
    return row ? this.mapToEntity(row) : null;
  }

  async findByAccountUuids(accountUuids: string[]): Promise<RepositoryStatistics[]> {
    if (accountUuids.length === 0) return [];
    
    const db = getDatabase();
    const placeholders = accountUuids.map(() => '?').join(', ');
    const rows = db.prepare(`SELECT * FROM repository_statistics WHERE account_uuid IN (${placeholders})`).all(...accountUuids) as RepositoryStatisticsRow[];
    return rows.map(row => this.mapToEntity(row));
  }

  async findAll(options?: { skip?: number; take?: number }): Promise<RepositoryStatistics[]> {
    const db = getDatabase();
    const skip = options?.skip ?? 0;
    const take = options?.take ?? 100;
    
    const rows = db.prepare('SELECT * FROM repository_statistics ORDER BY created_at DESC LIMIT ? OFFSET ?').all(take, skip) as RepositoryStatisticsRow[];
    return rows.map(row => this.mapToEntity(row));
  }

  async count(): Promise<number> {
    const db = getDatabase();
    const result = db.prepare('SELECT COUNT(*) as count FROM repository_statistics').get() as { count: number };
    return result.count;
  }

  async delete(uuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM repository_statistics WHERE uuid = ?').run(uuid);
  }

  private mapToEntity(row: RepositoryStatisticsRow): RepositoryStatistics {
    const { RepositoryStatistics } = require('@dailyuse/domain-server/repository');
    const dto: RepositoryStatisticsPersistenceDTO = {
      uuid: row.uuid,
      accountUuid: row.account_uuid,
      totalRepositories: row.total_repositories,
      activeRepositories: row.active_repositories,
      archivedRepositories: row.archived_repositories,
      totalResources: row.total_resources,
      totalFolders: row.total_folders,
      totalTags: row.total_tags,
      totalStorageBytes: row.total_storage_bytes,
      lastUpdatedAt: row.last_updated_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    return RepositoryStatistics.fromPersistence(dto);
  }
}
