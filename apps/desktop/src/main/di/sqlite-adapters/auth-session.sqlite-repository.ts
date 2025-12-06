/**
 * SQLite Auth Session Repository
 *
 * 实现 IAuthSessionRepository 接口的 SQLite 适配器
 */

import type { IAuthSessionRepository } from '@dailyuse/domain-server/authentication';
import { AuthSession } from '@dailyuse/domain-server/authentication';
import type { AuthSessionPersistenceDTO } from '@dailyuse/contracts/authentication';
import { getDatabase, transaction } from '../../database';

/**
 * AuthSession SQLite Repository 实现
 */
export class SqliteAuthSessionRepository implements IAuthSessionRepository {
  /**
   * 保存会话（创建或更新）
   */
  async save(session: AuthSession): Promise<void> {
    const db = getDatabase();
    const dto = session.toPersistenceDTO();

    transaction(() => {
      const existing = db
        .prepare('SELECT uuid FROM auth_sessions WHERE uuid = ?')
        .get(dto.uuid);

      if (existing) {
        db.prepare(`
          UPDATE auth_sessions SET
            account_uuid = ?,
            access_token = ?,
            access_token_expires_at = ?,
            refresh_token = ?,
            refresh_token_expires_at = ?,
            device_id = ?,
            device_type = ?,
            device_os = ?,
            device_browser = ?,
            status = ?,
            ip_address = ?,
            location_country = ?,
            location_region = ?,
            location_city = ?,
            location_timezone = ?,
            last_activity_at = ?,
            last_activity_type = ?,
            history = ?,
            expires_at = ?,
            revoked_at = ?
          WHERE uuid = ?
        `).run(
          dto.accountUuid,
          dto.accessToken,
          dto.accessTokenExpiresAt,
          dto.refreshToken,
          dto.refreshTokenExpiresAt,
          dto.deviceId,
          dto.deviceType,
          dto.deviceOs ?? null,
          dto.deviceBrowser ?? null,
          dto.status,
          dto.ipAddress,
          dto.locationCountry ?? null,
          dto.locationRegion ?? null,
          dto.locationCity ?? null,
          dto.locationTimezone ?? null,
          dto.lastActivityAt,
          dto.lastActivityType ?? null,
          dto.history,
          dto.expiresAt,
          dto.revokedAt ?? null,
          dto.uuid
        );
      } else {
        db.prepare(`
          INSERT INTO auth_sessions (
            uuid, account_uuid, access_token, access_token_expires_at,
            refresh_token, refresh_token_expires_at, device_id, device_type,
            device_os, device_browser, status, ip_address, location_country,
            location_region, location_city, location_timezone, last_activity_at,
            last_activity_type, history, created_at, expires_at, revoked_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          dto.uuid,
          dto.accountUuid,
          dto.accessToken,
          dto.accessTokenExpiresAt,
          dto.refreshToken,
          dto.refreshTokenExpiresAt,
          dto.deviceId,
          dto.deviceType,
          dto.deviceOs ?? null,
          dto.deviceBrowser ?? null,
          dto.status,
          dto.ipAddress,
          dto.locationCountry ?? null,
          dto.locationRegion ?? null,
          dto.locationCity ?? null,
          dto.locationTimezone ?? null,
          dto.lastActivityAt,
          dto.lastActivityType ?? null,
          dto.history,
          dto.createdAt,
          dto.expiresAt,
          dto.revokedAt ?? null
        );
      }
    });
  }

  /**
   * 根据 UUID 查找会话
   */
  async findByUuid(uuid: string): Promise<AuthSession | null> {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM auth_sessions WHERE uuid = ?')
      .get(uuid) as AuthSessionRow | undefined;

    return row ? this.mapToEntity(row) : null;
  }

  /**
   * 根据账户 UUID 查找所有会话
   */
  async findByAccountUuid(accountUuid: string): Promise<AuthSession[]> {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM auth_sessions WHERE account_uuid = ? ORDER BY created_at DESC')
      .all(accountUuid) as AuthSessionRow[];

    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 根据访问令牌查找会话
   */
  async findByAccessToken(accessToken: string): Promise<AuthSession | null> {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM auth_sessions WHERE access_token = ?')
      .get(accessToken) as AuthSessionRow | undefined;

    return row ? this.mapToEntity(row) : null;
  }

  /**
   * 根据刷新令牌查找会话
   */
  async findByRefreshToken(refreshToken: string): Promise<AuthSession | null> {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM auth_sessions WHERE refresh_token = ?')
      .get(refreshToken) as AuthSessionRow | undefined;

    return row ? this.mapToEntity(row) : null;
  }

  /**
   * 根据设备 ID 查找会话
   */
  async findByDeviceId(deviceId: string): Promise<AuthSession[]> {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM auth_sessions WHERE device_id = ? ORDER BY created_at DESC')
      .all(deviceId) as AuthSessionRow[];

    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 查找活跃会话
   */
  async findActiveSessions(accountUuid: string): Promise<AuthSession[]> {
    const db = getDatabase();
    const now = Date.now();
    const rows = db
      .prepare(`
        SELECT * FROM auth_sessions 
        WHERE account_uuid = ? 
          AND status = 'ACTIVE' 
          AND expires_at > ?
        ORDER BY last_activity_at DESC
      `)
      .all(accountUuid, now) as AuthSessionRow[];

    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 查找活跃会话（别名方法）
   */
  async findActiveSessionsByAccountUuid(accountUuid: string): Promise<AuthSession[]> {
    return this.findActiveSessions(accountUuid);
  }

  /**
   * 查找所有会话（支持分页）
   */
  async findAll(params?: { skip?: number; take?: number }): Promise<AuthSession[]> {
    const db = getDatabase();
    const skip = params?.skip ?? 0;
    const take = params?.take ?? 100;

    const rows = db
      .prepare('SELECT * FROM auth_sessions ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .all(take, skip) as AuthSessionRow[];

    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 根据状态查找会话
   */
  async findByStatus(
    status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'LOCKED',
    params?: { skip?: number; take?: number }
  ): Promise<AuthSession[]> {
    const db = getDatabase();
    const skip = params?.skip ?? 0;
    const take = params?.take ?? 100;

    const rows = db
      .prepare('SELECT * FROM auth_sessions WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .all(status, take, skip) as AuthSessionRow[];

    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 删除会话
   */
  async delete(uuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM auth_sessions WHERE uuid = ?').run(uuid);
  }

  /**
   * 删除账户的所有会话
   */
  async deleteByAccountUuid(accountUuid: string): Promise<number> {
    const db = getDatabase();
    const result = db
      .prepare('DELETE FROM auth_sessions WHERE account_uuid = ?')
      .run(accountUuid);
    return result.changes;
  }

  /**
   * 批量删除过期会话
   */
  async deleteExpired(): Promise<number> {
    const db = getDatabase();
    const now = Date.now();
    const result = db
      .prepare('DELETE FROM auth_sessions WHERE expires_at < ? OR (revoked_at IS NOT NULL AND revoked_at < ?)')
      .run(now, now);
    return result.changes;
  }

  /**
   * 将数据库行映射到实体
   */
  private mapToEntity(row: AuthSessionRow): AuthSession {
    const dto: AuthSessionPersistenceDTO = {
      uuid: row.uuid,
      accountUuid: row.account_uuid,
      accessToken: row.access_token,
      accessTokenExpiresAt: row.access_token_expires_at,
      refreshToken: row.refresh_token,
      refreshTokenExpiresAt: row.refresh_token_expires_at,
      deviceId: row.device_id,
      deviceType: row.device_type as AuthSessionPersistenceDTO['deviceType'],
      deviceOs: row.device_os,
      deviceBrowser: row.device_browser,
      status: row.status as AuthSessionPersistenceDTO['status'],
      ipAddress: row.ip_address,
      locationCountry: row.location_country,
      locationRegion: row.location_region,
      locationCity: row.location_city,
      locationTimezone: row.location_timezone,
      lastActivityAt: row.last_activity_at,
      lastActivityType: row.last_activity_type,
      history: row.history,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      revokedAt: row.revoked_at,
    };
    return AuthSession.fromPersistenceDTO(dto);
  }
}

// ========== 类型定义 ==========

interface AuthSessionRow {
  uuid: string;
  account_uuid: string;
  access_token: string;
  access_token_expires_at: number;
  refresh_token: string;
  refresh_token_expires_at: number;
  device_id: string;
  device_type: string;
  device_os: string | null;
  device_browser: string | null;
  status: string;
  ip_address: string;
  location_country: string | null;
  location_region: string | null;
  location_city: string | null;
  location_timezone: string | null;
  last_activity_at: number;
  last_activity_type: string | null;
  history: string;
  created_at: number;
  expires_at: number;
  revoked_at: number | null;
}
