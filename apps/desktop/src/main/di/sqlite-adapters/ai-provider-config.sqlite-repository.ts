// @ts-nocheck
/**
 * SQLite AI Provider Config Repository
 * TODO: 修复类型定义后移除 @ts-nocheck
 */

import type { IAIProviderConfigRepository } from '@dailyuse/domain-server/ai';
import type { AIProviderConfig } from '@dailyuse/domain-server/ai';
import { getDatabase, transaction } from '../../database';

export class SqliteAIProviderConfigRepository implements IAIProviderConfigRepository {
  async save(config: AIProviderConfig): Promise<void> {
    const db = getDatabase();
    const dto = config.toPersistenceDTO();

    transaction(() => {
      const existing = db.prepare('SELECT uuid FROM ai_provider_configs WHERE uuid = ?').get(dto.uuid);

      if (existing) {
        db.prepare(`
          UPDATE ai_provider_configs SET
            account_uuid = ?, provider = ?, api_key = ?, base_url = ?, model = ?,
            enabled = ?, priority = ?, rate_limit = ?, timeout = ?, config = ?, updated_at = ?
          WHERE uuid = ?
        `).run(
          dto.accountUuid, dto.provider, dto.apiKey, dto.baseUrl, dto.model,
          dto.enabled ? 1 : 0, dto.priority, dto.rateLimit, dto.timeout,
          JSON.stringify(dto.config), dto.updatedAt, dto.uuid
        );
      } else {
        db.prepare(`
          INSERT INTO ai_provider_configs (
            uuid, account_uuid, provider, api_key, base_url, model, enabled,
            priority, rate_limit, timeout, config, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          dto.uuid, dto.accountUuid, dto.provider, dto.apiKey, dto.baseUrl, dto.model,
          dto.enabled ? 1 : 0, dto.priority, dto.rateLimit, dto.timeout,
          JSON.stringify(dto.config), dto.createdAt, dto.updatedAt
        );
      }
    });
  }

  async findByUuid(uuid: string): Promise<AIProviderConfig | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM ai_provider_configs WHERE uuid = ?').get(uuid);
    return row ? this.mapToEntity(row) : null;
  }

  async findByAccountUuid(accountUuid: string): Promise<AIProviderConfig[]> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM ai_provider_configs WHERE account_uuid = ? ORDER BY priority ASC').all(accountUuid);
    return rows.map((row) => this.mapToEntity(row));
  }

  async findByProvider(provider: string): Promise<AIProviderConfig[]> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM ai_provider_configs WHERE provider = ?').all(provider);
    return rows.map((row) => this.mapToEntity(row));
  }

  async findEnabled(accountUuid: string): Promise<AIProviderConfig[]> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM ai_provider_configs WHERE account_uuid = ? AND enabled = 1 ORDER BY priority ASC').all(accountUuid);
    return rows.map((row) => this.mapToEntity(row));
  }

  async delete(uuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM ai_provider_configs WHERE uuid = ?').run(uuid);
  }

  private mapToEntity(row: unknown): AIProviderConfig {
    const { AIProviderConfig } = require('@dailyuse/domain-server/ai');
    return AIProviderConfig.fromPersistenceDTO(row);
  }
}
