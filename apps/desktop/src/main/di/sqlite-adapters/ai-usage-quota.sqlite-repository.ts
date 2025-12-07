/**
 * SQLite AI Usage Quota Repository
 *
 * 实现 IAIUsageQuotaRepository 接口
 */

import type { IAIUsageQuotaRepository } from '@dailyuse/domain-server/ai';
import type { AIUsageQuotaServerDTO, QuotaResetPeriod } from '@dailyuse/contracts/ai';
import { getDatabase, transaction } from '../../database';

interface AIUsageQuotaRow {
  uuid: string;
  account_uuid: string;
  quota_limit: number;
  current_usage: number;
  reset_period: string;
  last_reset_at: number;
  next_reset_at: number;
  created_at: number;
  updated_at: number;
}

export class SqliteAIUsageQuotaRepository implements IAIUsageQuotaRepository {
  /**
   * 保存配额（创建或更新）
   */
  async save(quota: AIUsageQuotaServerDTO): Promise<void> {
    const db = getDatabase();

    transaction(() => {
      const existing = db.prepare('SELECT uuid FROM ai_usage_quotas WHERE uuid = ?').get(quota.uuid);

      if (existing) {
        db.prepare(`
          UPDATE ai_usage_quotas SET
            account_uuid = ?, quota_limit = ?, current_usage = ?,
            reset_period = ?, last_reset_at = ?, next_reset_at = ?, updated_at = ?
          WHERE uuid = ?
        `).run(
          quota.accountUuid, quota.quotaLimit, quota.currentUsage,
          quota.resetPeriod, quota.lastResetAt, quota.nextResetAt, Date.now(),
          quota.uuid
        );
      } else {
        db.prepare(`
          INSERT INTO ai_usage_quotas (
            uuid, account_uuid, quota_limit, current_usage,
            reset_period, last_reset_at, next_reset_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          quota.uuid, quota.accountUuid, quota.quotaLimit, quota.currentUsage,
          quota.resetPeriod, quota.lastResetAt, quota.nextResetAt,
          quota.createdAt, quota.updatedAt
        );
      }
    });
  }

  /**
   * 根据 UUID 查找配额
   */
  async findByUuid(uuid: string): Promise<AIUsageQuotaServerDTO | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM ai_usage_quotas WHERE uuid = ?').get(uuid) as AIUsageQuotaRow | undefined;
    return row ? this.mapToDTO(row) : null;
  }

  /**
   * 根据账户 UUID 查找配额（每个账户只有一条配额记录）
   */
  async findByAccountUuid(accountUuid: string): Promise<AIUsageQuotaServerDTO | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM ai_usage_quotas WHERE account_uuid = ?').get(accountUuid) as AIUsageQuotaRow | undefined;
    return row ? this.mapToDTO(row) : null;
  }

  /**
   * 创建默认配额（如果不存在）
   */
  async createDefaultQuota(accountUuid: string): Promise<AIUsageQuotaServerDTO> {
    const existing = await this.findByAccountUuid(accountUuid);
    if (existing) {
      return existing;
    }

    const now = Date.now();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    nextMonth.setHours(0, 0, 0, 0);

    const defaultQuota: AIUsageQuotaServerDTO = {
      uuid: crypto.randomUUID(),
      accountUuid,
      quotaLimit: 100000, // 默认 10万 tokens
      currentUsage: 0,
      resetPeriod: 'MONTHLY' as QuotaResetPeriod,
      lastResetAt: now,
      nextResetAt: nextMonth.getTime(),
      createdAt: now,
      updatedAt: now,
    };

    await this.save(defaultQuota);
    return defaultQuota;
  }

  /**
   * 删除配额
   */
  async delete(uuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM ai_usage_quotas WHERE uuid = ?').run(uuid);
  }

  /**
   * 检查配额是否存在
   */
  async exists(accountUuid: string): Promise<boolean> {
    const db = getDatabase();
    const row = db.prepare('SELECT 1 FROM ai_usage_quotas WHERE account_uuid = ?').get(accountUuid);
    return !!row;
  }

  private mapToDTO(row: AIUsageQuotaRow): AIUsageQuotaServerDTO {
    return {
      uuid: row.uuid,
      accountUuid: row.account_uuid,
      quotaLimit: row.quota_limit,
      currentUsage: row.current_usage,
      resetPeriod: row.reset_period as QuotaResetPeriod,
      lastResetAt: row.last_reset_at,
      nextResetAt: row.next_reset_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
