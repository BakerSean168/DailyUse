/**
 * SQLite AI Provider Config Repository
 *
 * 实现 IAIProviderConfigRepository 接口
 */

import type { IAIProviderConfigRepository } from '@dailyuse/domain-server/ai';
import type { AIProviderConfigServerDTO, AIProviderType, AIModelInfo } from '@dailyuse/contracts/ai';
import { getDatabase, transaction } from '../../database';

interface AIProviderConfigRow {
  uuid: string;
  account_uuid: string;
  name: string;
  provider_type: string;
  base_url: string;
  api_key: string;
  default_model: string | null;
  available_models: string;
  is_active: number;
  is_default: number;
  priority: number;
  created_at: number;
  updated_at: number;
}

export class SqliteAIProviderConfigRepository implements IAIProviderConfigRepository {
  /**
   * 保存配置（创建或更新）
   */
  async save(config: AIProviderConfigServerDTO): Promise<void> {
    const db = getDatabase();

    transaction(() => {
      const existing = db.prepare('SELECT uuid FROM ai_provider_configs WHERE uuid = ?').get(config.uuid);

      if (existing) {
        db.prepare(`
          UPDATE ai_provider_configs SET
            account_uuid = ?, name = ?, provider_type = ?, base_url = ?, api_key = ?,
            default_model = ?, available_models = ?, is_active = ?, is_default = ?,
            priority = ?, updated_at = ?
          WHERE uuid = ?
        `).run(
          config.accountUuid, config.name, config.providerType, config.baseUrl, config.apiKey,
          config.defaultModel, JSON.stringify(config.availableModels), config.isActive ? 1 : 0,
          config.isDefault ? 1 : 0, config.priority, Date.now(),
          config.uuid
        );
      } else {
        db.prepare(`
          INSERT INTO ai_provider_configs (
            uuid, account_uuid, name, provider_type, base_url, api_key,
            default_model, available_models, is_active, is_default,
            priority, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          config.uuid, config.accountUuid, config.name, config.providerType,
          config.baseUrl, config.apiKey, config.defaultModel,
          JSON.stringify(config.availableModels), config.isActive ? 1 : 0,
          config.isDefault ? 1 : 0, config.priority, config.createdAt, config.updatedAt
        );
      }
    });
  }

  /**
   * 根据 UUID 查找配置
   */
  async findByUuid(uuid: string): Promise<AIProviderConfigServerDTO | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM ai_provider_configs WHERE uuid = ?').get(uuid) as AIProviderConfigRow | undefined;
    return row ? this.mapToDTO(row) : null;
  }

  /**
   * 根据账户 UUID 查找所有配置
   */
  async findByAccountUuid(accountUuid: string): Promise<AIProviderConfigServerDTO[]> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM ai_provider_configs WHERE account_uuid = ? ORDER BY priority ASC').all(accountUuid) as AIProviderConfigRow[];
    return rows.map((row) => this.mapToDTO(row));
  }

  /**
   * 查找账户的默认 Provider
   */
  async findDefaultByAccountUuid(accountUuid: string): Promise<AIProviderConfigServerDTO | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM ai_provider_configs WHERE account_uuid = ? AND is_default = 1').get(accountUuid) as AIProviderConfigRow | undefined;
    return row ? this.mapToDTO(row) : null;
  }

  /**
   * 根据账户和名称查找（用于唯一性检查）
   */
  async findByAccountUuidAndName(accountUuid: string, name: string): Promise<AIProviderConfigServerDTO | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM ai_provider_configs WHERE account_uuid = ? AND name = ?').get(accountUuid, name) as AIProviderConfigRow | undefined;
    return row ? this.mapToDTO(row) : null;
  }

  /**
   * 删除配置
   */
  async delete(uuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM ai_provider_configs WHERE uuid = ?').run(uuid);
  }

  /**
   * 检查配置是否存在
   */
  async exists(uuid: string): Promise<boolean> {
    const db = getDatabase();
    const row = db.prepare('SELECT 1 FROM ai_provider_configs WHERE uuid = ?').get(uuid);
    return !!row;
  }

  /**
   * 取消账户下所有 Provider 的默认状态
   */
  async clearDefaultForAccount(accountUuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('UPDATE ai_provider_configs SET is_default = 0, updated_at = ? WHERE account_uuid = ?').run(Date.now(), accountUuid);
  }

  private mapToDTO(row: AIProviderConfigRow): AIProviderConfigServerDTO {
    return {
      uuid: row.uuid,
      accountUuid: row.account_uuid,
      name: row.name,
      providerType: row.provider_type as AIProviderType,
      baseUrl: row.base_url,
      apiKey: row.api_key,
      defaultModel: row.default_model,
      availableModels: JSON.parse(row.available_models || '[]') as AIModelInfo[],
      isActive: row.is_active === 1,
      isDefault: row.is_default === 1,
      priority: row.priority,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
