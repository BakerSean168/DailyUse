/**
 * SQLite Account Repository
 *
 * 实现 IAccountRepository 接口的 SQLite 适配器
 */

import type { IAccountRepository } from '@dailyuse/domain-server/account';
import { Account } from '@dailyuse/domain-server/account';
import type { AccountPersistenceDTO } from '@dailyuse/contracts/account';
import { getDatabase, transaction } from '../../database';

/**
 * Account SQLite Repository 实现
 */
export class SqliteAccountRepository implements IAccountRepository {
  /**
   * 保存账户（创建或更新）
   */
  async save(account: Account): Promise<void> {
    const db = getDatabase();
    const dto = account.toPersistenceDTO();

    transaction(() => {
      const existing = db
        .prepare('SELECT uuid FROM accounts WHERE uuid = ?')
        .get(dto.uuid);

      if (existing) {
        db.prepare(`
          UPDATE accounts SET
            username = ?,
            email = ?,
            email_verified = ?,
            phone_number = ?,
            phone_verified = ?,
            status = ?,
            display_name = ?,
            avatar = ?,
            bio = ?,
            location = ?,
            timezone = ?,
            language = ?,
            date_of_birth = ?,
            gender = ?,
            preferences = ?,
            subscription_id = ?,
            subscription_plan = ?,
            subscription_status = ?,
            subscription_start_date = ?,
            subscription_end_date = ?,
            subscription_renewal_date = ?,
            subscription_auto_renew = ?,
            storage_used = ?,
            storage_quota = ?,
            storage_quota_type = ?,
            two_factor_enabled = ?,
            last_password_change = ?,
            login_attempts = ?,
            locked_until = ?,
            history = ?,
            stats_total_goals = ?,
            stats_total_tasks = ?,
            stats_total_schedules = ?,
            stats_total_reminders = ?,
            stats_last_login_at = ?,
            stats_login_count = ?,
            updated_at = ?,
            last_active_at = ?,
            deleted_at = ?
          WHERE uuid = ?
        `).run(
          dto.username,
          dto.email,
          dto.emailVerified ? 1 : 0,
          dto.phoneNumber,
          dto.phoneVerified ? 1 : 0,
          dto.status,
          dto.displayName,
          dto.avatar,
          dto.bio,
          dto.location,
          dto.timezone,
          dto.language,
          dto.dateOfBirth,
          dto.gender,
          dto.preferences,
          dto.subscriptionId,
          dto.subscriptionPlan,
          dto.subscriptionStatus,
          dto.subscriptionStartDate,
          dto.subscriptionEndDate,
          dto.subscriptionRenewalDate,
          dto.subscriptionAutoRenew ? 1 : 0,
          dto.storageUsed,
          dto.storageQuota,
          dto.storageQuotaType,
          dto.twoFactorEnabled ? 1 : 0,
          dto.lastPasswordChange,
          dto.loginAttempts,
          dto.lockedUntil,
          dto.history,
          dto.statsTotalGoals,
          dto.statsTotalTasks,
          dto.statsTotalSchedules,
          dto.statsTotalReminders,
          dto.statsLastLoginAt,
          dto.statsLoginCount,
          dto.updatedAt,
          dto.lastActiveAt,
          dto.deletedAt,
          dto.uuid
        );
      } else {
        db.prepare(`
          INSERT INTO accounts (
            uuid, username, email, email_verified, phone_number, phone_verified,
            status, display_name, avatar, bio, location, timezone, language,
            date_of_birth, gender, preferences, subscription_id, subscription_plan,
            subscription_status, subscription_start_date, subscription_end_date,
            subscription_renewal_date, subscription_auto_renew, storage_used,
            storage_quota, storage_quota_type, two_factor_enabled, last_password_change,
            login_attempts, locked_until, history, stats_total_goals, stats_total_tasks,
            stats_total_schedules, stats_total_reminders, stats_last_login_at,
            stats_login_count, created_at, updated_at, last_active_at, deleted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          dto.uuid,
          dto.username,
          dto.email,
          dto.emailVerified ? 1 : 0,
          dto.phoneNumber,
          dto.phoneVerified ? 1 : 0,
          dto.status,
          dto.displayName,
          dto.avatar,
          dto.bio,
          dto.location,
          dto.timezone,
          dto.language,
          dto.dateOfBirth,
          dto.gender,
          dto.preferences,
          dto.subscriptionId,
          dto.subscriptionPlan,
          dto.subscriptionStatus,
          dto.subscriptionStartDate,
          dto.subscriptionEndDate,
          dto.subscriptionRenewalDate,
          dto.subscriptionAutoRenew ? 1 : 0,
          dto.storageUsed,
          dto.storageQuota,
          dto.storageQuotaType,
          dto.twoFactorEnabled ? 1 : 0,
          dto.lastPasswordChange,
          dto.loginAttempts,
          dto.lockedUntil,
          dto.history,
          dto.statsTotalGoals,
          dto.statsTotalTasks,
          dto.statsTotalSchedules,
          dto.statsTotalReminders,
          dto.statsLastLoginAt,
          dto.statsLoginCount,
          dto.createdAt,
          dto.updatedAt,
          dto.lastActiveAt,
          dto.deletedAt
        );
      }
    });
  }

  /**
   * 通过 UUID 查找账户
   */
  async findById(uuid: string): Promise<Account | null> {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM accounts WHERE uuid = ? AND deleted_at IS NULL')
      .get(uuid) as AccountRow | undefined;

    return row ? this.mapToEntity(row) : null;
  }

  /**
   * 通过用户名查找账户
   */
  async findByUsername(username: string): Promise<Account | null> {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM accounts WHERE username = ? AND deleted_at IS NULL')
      .get(username) as AccountRow | undefined;

    return row ? this.mapToEntity(row) : null;
  }

  /**
   * 通过邮箱查找账户
   */
  async findByEmail(email: string): Promise<Account | null> {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM accounts WHERE email = ? AND deleted_at IS NULL')
      .get(email) as AccountRow | undefined;

    return row ? this.mapToEntity(row) : null;
  }

  /**
   * 通过手机号查找账户
   */
  async findByPhone(phoneNumber: string): Promise<Account | null> {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM accounts WHERE phone_number = ? AND deleted_at IS NULL')
      .get(phoneNumber) as AccountRow | undefined;

    return row ? this.mapToEntity(row) : null;
  }

  /**
   * 检查用户名是否存在
   */
  async existsByUsername(username: string): Promise<boolean> {
    const db = getDatabase();
    const row = db
      .prepare('SELECT 1 FROM accounts WHERE username = ? AND deleted_at IS NULL')
      .get(username);
    return !!row;
  }

  /**
   * 检查邮箱是否存在
   */
  async existsByEmail(email: string): Promise<boolean> {
    const db = getDatabase();
    const row = db
      .prepare('SELECT 1 FROM accounts WHERE email = ? AND deleted_at IS NULL')
      .get(email);
    return !!row;
  }

  /**
   * 删除账户
   */
  async delete(uuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM accounts WHERE uuid = ?').run(uuid);
  }

  /**
   * 软删除账户
   */
  async softDelete(uuid: string): Promise<void> {
    const db = getDatabase();
    const now = Date.now();
    db.prepare('UPDATE accounts SET deleted_at = ?, updated_at = ? WHERE uuid = ?').run(
      now,
      now,
      uuid
    );
  }

  /**
   * 查找所有账户
   */
  async findAll(options?: {
    page?: number;
    pageSize?: number;
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
  }): Promise<{ accounts: Account[]; total: number }> {
    const db = getDatabase();

    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    let countQuery = 'SELECT COUNT(*) as count FROM accounts WHERE deleted_at IS NULL';
    let query = 'SELECT * FROM accounts WHERE deleted_at IS NULL';
    const countParams: unknown[] = [];
    const params: unknown[] = [];

    if (options?.status) {
      countQuery += ' AND status = ?';
      countParams.push(options.status);
      query += ' AND status = ?';
      params.push(options.status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);

    const countResult = db.prepare(countQuery).get(...countParams) as { count: number };
    const rows = db.prepare(query).all(...params) as AccountRow[];

    return {
      accounts: rows.map((row) => this.mapToEntity(row)),
      total: countResult.count,
    };
  }

  /**
   * 统计账户数量
   */
  async count(options?: { status?: string }): Promise<number> {
    const db = getDatabase();

    let query = 'SELECT COUNT(*) as count FROM accounts WHERE deleted_at IS NULL';
    const params: unknown[] = [];

    if (options?.status) {
      query += ' AND status = ?';
      params.push(options.status);
    }

    const result = db.prepare(query).get(...params) as { count: number };
    return result.count;
  }

  private mapToEntity(row: AccountRow): Account {
    const dto: AccountPersistenceDTO = {
      uuid: row.uuid,
      username: row.username,
      email: row.email ?? '',
      emailVerified: !!row.email_verified,
      phoneNumber: row.phone_number,
      phoneVerified: !!row.phone_verified,
      status: row.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED',
      displayName: row.display_name ?? row.username,
      avatar: row.avatar,
      bio: row.bio,
      location: row.location,
      timezone: row.timezone ?? 'UTC',
      language: row.language ?? 'en',
      dateOfBirth: row.date_of_birth,
      gender: row.gender as AccountPersistenceDTO['gender'],
      preferences: row.preferences ?? '{}',
      subscriptionId: row.subscription_id,
      subscriptionPlan: row.subscription_plan as AccountPersistenceDTO['subscriptionPlan'],
      subscriptionStatus: row.subscription_status as AccountPersistenceDTO['subscriptionStatus'],
      subscriptionStartDate: row.subscription_start_date,
      subscriptionEndDate: row.subscription_end_date,
      subscriptionRenewalDate: row.subscription_renewal_date,
      subscriptionAutoRenew: row.subscription_auto_renew !== null ? !!row.subscription_auto_renew : undefined,
      storageUsed: row.storage_used ?? 0,
      storageQuota: row.storage_quota ?? 1073741824, // 1GB default
      storageQuotaType: (row.storage_quota_type as AccountPersistenceDTO['storageQuotaType']) ?? 'FREE',
      twoFactorEnabled: !!row.two_factor_enabled,
      lastPasswordChange: row.last_password_change,
      loginAttempts: row.login_attempts ?? 0,
      lockedUntil: row.locked_until,
      history: row.history ?? '[]',
      statsTotalGoals: row.stats_total_goals ?? 0,
      statsTotalTasks: row.stats_total_tasks ?? 0,
      statsTotalSchedules: row.stats_total_schedules ?? 0,
      statsTotalReminders: row.stats_total_reminders ?? 0,
      statsLastLoginAt: row.stats_last_login_at,
      statsLoginCount: row.stats_login_count ?? 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastActiveAt: row.last_active_at,
      deletedAt: row.deleted_at,
    };
    return Account.fromPersistenceDTO(dto);
  }
}

// ========== 类型定义 ==========

interface AccountRow {
  uuid: string;
  username: string;
  email: string | null;
  email_verified: number;
  phone_number: string | null;
  phone_verified: number;
  status: string;
  display_name: string | null;
  avatar: string | null;
  bio: string | null;
  location: string | null;
  timezone: string | null;
  language: string | null;
  date_of_birth: number | null;
  gender: string | null;
  preferences: string | null;
  subscription_id: string | null;
  subscription_plan: string | null;
  subscription_status: string | null;
  subscription_start_date: number | null;
  subscription_end_date: number | null;
  subscription_renewal_date: number | null;
  subscription_auto_renew: number | null;
  storage_used: number | null;
  storage_quota: number | null;
  storage_quota_type: string | null;
  two_factor_enabled: number;
  last_password_change: number | null;
  login_attempts: number | null;
  locked_until: number | null;
  history: string | null;
  stats_total_goals: number | null;
  stats_total_tasks: number | null;
  stats_total_schedules: number | null;
  stats_total_reminders: number | null;
  stats_last_login_at: number | null;
  stats_login_count: number | null;
  created_at: number;
  updated_at: number;
  last_active_at: number | null;
  deleted_at: number | null;
}
