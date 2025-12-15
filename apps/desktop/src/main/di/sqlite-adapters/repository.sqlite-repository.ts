/**
 * SQLite Repository Repository (for knowledge/resource repositories)
 *
 * 实现 IRepositoryRepository 接口
 */

import type { IRepositoryRepository } from '@dailyuse/domain-server/repository';
import { Repository } from '@dailyuse/domain-server/repository';
import { RepositoryStatus, RepositoryType } from '@dailyuse/contracts/repository';
import { getDatabase, transaction } from '../../database';

interface RepositoryRow {
  uuid: string;
  account_uuid: string;
  name: string;
  type: string;
  path: string;
  description: string | null;
  config: string;
  stats: string;
  status: string;
  created_at: number;
  updated_at: number;
}

export class SqliteRepositoryRepository implements IRepositoryRepository {
  /**
   * 保存仓库
   */
  async save(repository: Repository): Promise<void> {
    const db = getDatabase();
    const dto = repository.toPersistenceDTO();

    transaction(() => {
      const existing = db.prepare('SELECT uuid FROM repositories WHERE uuid = ?').get(dto.uuid);

      if (existing) {
        db.prepare(`
          UPDATE repositories SET
            account_uuid = ?, name = ?, type = ?, path = ?, description = ?,
            config = ?, stats = ?, status = ?, updated_at = ?
          WHERE uuid = ?
        `).run(
          dto.accountUuid, dto.name, dto.type, dto.path, dto.description,
          dto.config, dto.stats, dto.status, Date.now(),
          dto.uuid
        );
      } else {
        db.prepare(`
          INSERT INTO repositories (
            uuid, account_uuid, name, type, path, description,
            config, stats, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          dto.uuid, dto.accountUuid, dto.name, dto.type, dto.path, dto.description,
          dto.config, dto.stats, dto.status, dto.createdAt, dto.updatedAt
        );
      }
    });
  }

  /**
   * 根据 UUID 查找仓库
   */
  async findByUuid(uuid: string): Promise<Repository | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM repositories WHERE uuid = ?').get(uuid) as RepositoryRow | undefined;
    return row ? this.mapToEntity(row) : null;
  }

  /**
   * 根据账户 UUID 查找仓库列表
   */
  async findByAccountUuid(accountUuid: string): Promise<Repository[]> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM repositories WHERE account_uuid = ? ORDER BY name ASC').all(accountUuid) as RepositoryRow[];
    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 根据账户 UUID 和状态查找仓库列表
   */
  async findByAccountUuidAndStatus(accountUuid: string, status: RepositoryStatus): Promise<Repository[]> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM repositories WHERE account_uuid = ? AND status = ? ORDER BY name ASC').all(accountUuid, status) as RepositoryRow[];
    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 删除仓库
   */
  async delete(uuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM repositories WHERE uuid = ?').run(uuid);
  }

  /**
   * 检查仓库是否存在
   */
  async exists(uuid: string): Promise<boolean> {
    const db = getDatabase();
    const row = db.prepare('SELECT 1 FROM repositories WHERE uuid = ?').get(uuid);
    return !!row;
  }

  private mapToEntity(row: RepositoryRow): Repository {
    return Repository.fromPersistenceDTO({
      uuid: row.uuid,
      accountUuid: row.account_uuid,
      name: row.name,
      type: row.type as RepositoryType,
      path: row.path,
      description: row.description,
      config: row.config,
      stats: row.stats,
      status: row.status as RepositoryStatus,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
