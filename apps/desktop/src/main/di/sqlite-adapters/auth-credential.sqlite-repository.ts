/**
 * SQLite Auth Credential Repository
 *
 * 实现 IAuthCredentialRepository 接口的 SQLite 适配器
 */

import type { IAuthCredentialRepository } from '@dailyuse/domain-server/authentication';
import { AuthCredential } from '@dailyuse/domain-server/authentication';
import type { AuthCredentialPersistenceDTO } from '@dailyuse/contracts/authentication';
import { getDatabase, transaction } from '../../database';

/**
 * AuthCredential SQLite Repository 实现
 */
export class SqliteAuthCredentialRepository implements IAuthCredentialRepository {
  /**
   * 保存凭证（创建或更新）
   */
  async save(credential: AuthCredential): Promise<void> {
    const db = getDatabase();
    const dto = credential.toPersistenceDTO();

    transaction(() => {
      const existing = db
        .prepare('SELECT uuid FROM auth_credentials WHERE uuid = ?')
        .get(dto.uuid);

      if (existing) {
        db.prepare(`
          UPDATE auth_credentials SET
            account_uuid = ?,
            type = ?,
            password_credential = ?,
            api_key_credentials = ?,
            remember_me_tokens = ?,
            two_factor = ?,
            biometric = ?,
            status = ?,
            security = ?,
            history = ?,
            updated_at = ?,
            expires_at = ?,
            last_used_at = ?,
            revoked_at = ?
          WHERE uuid = ?
        `).run(
          dto.accountUuid,
          dto.type,
          dto.password_credential,
          dto.api_key_credentials,
          dto.remember_me_tokens,
          dto.two_factor,
          dto.biometric,
          dto.status,
          dto.security,
          dto.history,
          dto.updatedAt,
          dto.expiresAt ?? null,
          dto.lastUsedAt ?? null,
          dto.revokedAt ?? null,
          dto.uuid
        );
      } else {
        db.prepare(`
          INSERT INTO auth_credentials (
            uuid, account_uuid, type, password_credential, api_key_credentials,
            remember_me_tokens, two_factor, biometric, status, security, history,
            created_at, updated_at, expires_at, last_used_at, revoked_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          dto.uuid,
          dto.accountUuid,
          dto.type,
          dto.password_credential,
          dto.api_key_credentials,
          dto.remember_me_tokens,
          dto.two_factor,
          dto.biometric,
          dto.status,
          dto.security,
          dto.history,
          dto.createdAt,
          dto.updatedAt,
          dto.expiresAt ?? null,
          dto.lastUsedAt ?? null,
          dto.revokedAt ?? null
        );
      }
    });
  }

  /**
   * 根据 UUID 查找凭证
   */
  async findByUuid(uuid: string): Promise<AuthCredential | null> {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM auth_credentials WHERE uuid = ?')
      .get(uuid) as AuthCredentialRow | undefined;

    return row ? this.mapToEntity(row) : null;
  }

  /**
   * 根据账户 UUID 查找凭证
   */
  async findByAccountUuid(accountUuid: string): Promise<AuthCredential | null> {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM auth_credentials WHERE account_uuid = ?')
      .get(accountUuid) as AuthCredentialRow | undefined;

    return row ? this.mapToEntity(row) : null;
  }

  /**
   * 查找所有凭证（支持分页）
   */
  async findAll(params?: { skip?: number; take?: number }): Promise<AuthCredential[]> {
    const db = getDatabase();
    const skip = params?.skip ?? 0;
    const take = params?.take ?? 100;

    const rows = db
      .prepare('SELECT * FROM auth_credentials ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .all(take, skip) as AuthCredentialRow[];

    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 根据状态查找凭证
   */
  async findByStatus(
    status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED',
    params?: { skip?: number; take?: number }
  ): Promise<AuthCredential[]> {
    const db = getDatabase();
    const skip = params?.skip ?? 0;
    const take = params?.take ?? 100;

    const rows = db
      .prepare('SELECT * FROM auth_credentials WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .all(status, take, skip) as AuthCredentialRow[];

    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 根据类型查找凭证
   */
  async findByType(
    type: 'PASSWORD' | 'API_KEY' | 'BIOMETRIC' | 'MAGIC_LINK' | 'HARDWARE_KEY',
    params?: { skip?: number; take?: number }
  ): Promise<AuthCredential[]> {
    const db = getDatabase();
    const skip = params?.skip ?? 0;
    const take = params?.take ?? 100;

    const rows = db
      .prepare('SELECT * FROM auth_credentials WHERE type = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .all(type, take, skip) as AuthCredentialRow[];

    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 检查账户是否存在凭证
   */
  async existsByAccountUuid(accountUuid: string): Promise<boolean> {
    const db = getDatabase();
    const row = db
      .prepare('SELECT 1 FROM auth_credentials WHERE account_uuid = ?')
      .get(accountUuid);
    return !!row;
  }

  /**
   * 删除凭证
   */
  async delete(uuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM auth_credentials WHERE uuid = ?').run(uuid);
  }

  /**
   * 批量删除过期凭证
   */
  async deleteExpired(): Promise<number> {
    const db = getDatabase();
    const now = Date.now();
    const result = db
      .prepare('DELETE FROM auth_credentials WHERE expires_at IS NOT NULL AND expires_at < ?')
      .run(now);
    return result.changes;
  }

  /**
   * 将数据库行映射到实体
   */
  private mapToEntity(row: AuthCredentialRow): AuthCredential {
    const dto: AuthCredentialPersistenceDTO = {
      uuid: row.uuid,
      accountUuid: row.account_uuid,
      type: row.type as AuthCredentialPersistenceDTO['type'],
      password_credential: row.password_credential,
      api_key_credentials: row.api_key_credentials,
      remember_me_tokens: row.remember_me_tokens,
      two_factor: row.two_factor,
      biometric: row.biometric,
      status: row.status as AuthCredentialPersistenceDTO['status'],
      security: row.security,
      history: row.history,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      expiresAt: row.expires_at,
      lastUsedAt: row.last_used_at,
      revokedAt: row.revoked_at,
    };
    return AuthCredential.fromPersistenceDTO(dto);
  }
}

// ========== 类型定义 ==========

interface AuthCredentialRow {
  uuid: string;
  account_uuid: string;
  type: string;
  password_credential: string | null;
  api_key_credentials: string;
  remember_me_tokens: string;
  two_factor: string | null;
  biometric: string | null;
  status: string;
  security: string;
  history: string;
  created_at: number;
  updated_at: number;
  expires_at: number | null;
  last_used_at: number | null;
  revoked_at: number | null;
}
