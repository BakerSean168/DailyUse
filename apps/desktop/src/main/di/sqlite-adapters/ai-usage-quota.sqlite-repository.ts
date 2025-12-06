// @ts-nocheck
/**
 * SQLite AI Usage Quota Repository
 * TODO: 修复类型定义后移除 @ts-nocheck
 */

import type { IAIUsageQuotaRepository } from '@dailyuse/domain-server/ai';
import type { AIUsageQuota } from '@dailyuse/domain-server/ai';
import { getDatabase, transaction } from '../../database';

export class SqliteAIUsageQuotaRepository implements IAIUsageQuotaRepository {
  async save(quota: AIUsageQuota): Promise<void> {
    const db = getDatabase();
    const dto = quota.toPersistenceDTO();

    transaction(() => {
      const existing = db.prepare('SELECT uuid FROM ai_usage_quotas WHERE uuid = ?').get(dto.uuid);

      if (existing) {
        db.prepare(`
          UPDATE ai_usage_quotas SET
            account_uuid = ?, provider = ?, model = ?, tokens_used = ?, tokens_limit = ?,
            requests_count = ?, requests_limit = ?, period_start = ?, period_end = ?,
            reset_at = ?, updated_at = ?
          WHERE uuid = ?
        `).run(
          dto.accountUuid, dto.provider, dto.model, dto.tokensUsed, dto.tokensLimit,
          dto.requestsCount, dto.requestsLimit, dto.periodStart, dto.periodEnd,
          dto.resetAt, dto.updatedAt, dto.uuid
        );
      } else {
        db.prepare(`
          INSERT INTO ai_usage_quotas (
            uuid, account_uuid, provider, model, tokens_used, tokens_limit,
            requests_count, requests_limit, period_start, period_end, reset_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          dto.uuid, dto.accountUuid, dto.provider, dto.model, dto.tokensUsed, dto.tokensLimit,
          dto.requestsCount, dto.requestsLimit, dto.periodStart, dto.periodEnd,
          dto.resetAt, dto.createdAt, dto.updatedAt
        );
      }
    });
  }

  async findByUuid(uuid: string): Promise<AIUsageQuota | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM ai_usage_quotas WHERE uuid = ?').get(uuid);
    return row ? this.mapToEntity(row) : null;
  }

  async findByAccountUuid(accountUuid: string): Promise<AIUsageQuota[]> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM ai_usage_quotas WHERE account_uuid = ?').all(accountUuid);
    return rows.map((row) => this.mapToEntity(row));
  }

  async findByAccountAndProvider(accountUuid: string, provider: string): Promise<AIUsageQuota | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM ai_usage_quotas WHERE account_uuid = ? AND provider = ?').get(accountUuid, provider);
    return row ? this.mapToEntity(row) : null;
  }

  async delete(uuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM ai_usage_quotas WHERE uuid = ?').run(uuid);
  }

  private mapToEntity(row: unknown): AIUsageQuota {
    const { AIUsageQuota } = require('@dailyuse/domain-server/ai');
    return AIUsageQuota.fromPersistenceDTO(row);
  }
}
