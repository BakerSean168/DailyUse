/**
 * SQLite AI Generation Task Repository
 *
 * 实现 IAIGenerationTaskRepository 接口的 SQLite 适配器
 * 遵循 DDD Repository 模式
 */

import type { IAIGenerationTaskRepository } from '@dailyuse/domain-server/ai';
import type {
  AIGenerationTaskServerDTO,
  AIGenerationTaskPersistenceDTO,
  TaskStatus,
  GenerationTaskType,
} from '@dailyuse/contracts/ai';
import { getDatabase, transaction } from '../../database';

/**
 * Database row type
 */
interface AIGenerationTaskRow {
  uuid: string;
  account_uuid: string;
  conversation_uuid: string | null;
  type: string;
  status: string;
  provider: string;
  model: string;
  input: string;
  result: string | null;
  token_usage: string | null;
  error_message: string | null;
  retry_count: number;
  max_retries: number;
  processing_started_at: number | null;
  processing_completed_at: number | null;
  created_at: number;
  updated_at: number;
}

/**
 * AIGenerationTask SQLite Repository 实现
 */
export class SqliteAIGenerationTaskRepository implements IAIGenerationTaskRepository {
  /**
   * 保存任务（创建或更新）
   */
  async save(task: AIGenerationTaskServerDTO): Promise<void> {
    const db = getDatabase();
    const dto = this.toPersisteceDTO(task);

    transaction(() => {
      const existing = db
        .prepare('SELECT uuid FROM ai_generation_tasks WHERE uuid = ?')
        .get(dto.uuid);

      if (existing) {
        db.prepare(`
          UPDATE ai_generation_tasks SET
            account_uuid = ?,
            conversation_uuid = ?,
            type = ?,
            status = ?,
            provider = ?,
            model = ?,
            input = ?,
            result = ?,
            token_usage = ?,
            error_message = ?,
            retry_count = ?,
            max_retries = ?,
            processing_started_at = ?,
            processing_completed_at = ?,
            updated_at = ?
          WHERE uuid = ?
        `).run(
          dto.accountUuid,
          dto.conversationUuid,
          dto.type,
          dto.status,
          dto.provider,
          dto.model,
          dto.input,
          dto.result,
          dto.tokenUsage,
          dto.errorMessage,
          dto.retryCount,
          dto.maxRetries,
          dto.processingStartedAt,
          dto.processingCompletedAt,
          dto.updatedAt,
          dto.uuid
        );
      } else {
        db.prepare(`
          INSERT INTO ai_generation_tasks (
            uuid, account_uuid, conversation_uuid, type, status, provider, model,
            input, result, token_usage, error_message, retry_count, max_retries,
            processing_started_at, processing_completed_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          dto.uuid,
          dto.accountUuid,
          dto.conversationUuid,
          dto.type,
          dto.status,
          dto.provider,
          dto.model,
          dto.input,
          dto.result,
          dto.tokenUsage,
          dto.errorMessage,
          dto.retryCount,
          dto.maxRetries,
          dto.processingStartedAt,
          dto.processingCompletedAt,
          dto.createdAt,
          dto.updatedAt
        );
      }
    });
  }

  /**
   * 根据 UUID 查找任务
   */
  async findByUuid(uuid: string): Promise<AIGenerationTaskServerDTO | null> {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM ai_generation_tasks WHERE uuid = ?')
      .get(uuid) as AIGenerationTaskRow | undefined;

    if (!row) {
      return null;
    }

    return this.mapToServerDTO(row);
  }

  /**
   * 根据账户 UUID 查找所有任务
   */
  async findByAccountUuid(accountUuid: string): Promise<AIGenerationTaskServerDTO[]> {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM ai_generation_tasks WHERE account_uuid = ? ORDER BY created_at DESC')
      .all(accountUuid) as AIGenerationTaskRow[];

    return rows.map((row) => this.mapToServerDTO(row));
  }

  /**
   * 根据任务类型查找任务
   */
  async findByTaskType(
    accountUuid: string,
    taskType: GenerationTaskType
  ): Promise<AIGenerationTaskServerDTO[]> {
    const db = getDatabase();
    const rows = db
      .prepare(
        'SELECT * FROM ai_generation_tasks WHERE account_uuid = ? AND type = ? ORDER BY created_at DESC'
      )
      .all(accountUuid, taskType) as AIGenerationTaskRow[];

    return rows.map((row) => this.mapToServerDTO(row));
  }

  /**
   * 根据状态查找任务
   */
  async findByStatus(
    accountUuid: string,
    status: TaskStatus
  ): Promise<AIGenerationTaskServerDTO[]> {
    const db = getDatabase();
    const rows = db
      .prepare(
        'SELECT * FROM ai_generation_tasks WHERE account_uuid = ? AND status = ? ORDER BY created_at DESC'
      )
      .all(accountUuid, status) as AIGenerationTaskRow[];

    return rows.map((row) => this.mapToServerDTO(row));
  }

  /**
   * 查找最近的任务（分页）
   */
  async findRecent(
    accountUuid: string,
    limit: number,
    offset?: number
  ): Promise<AIGenerationTaskServerDTO[]> {
    const db = getDatabase();
    const rows = db
      .prepare(
        'SELECT * FROM ai_generation_tasks WHERE account_uuid = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
      )
      .all(accountUuid, limit, offset ?? 0) as AIGenerationTaskRow[];

    return rows.map((row) => this.mapToServerDTO(row));
  }

  /**
   * 删除任务
   */
  async delete(uuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM ai_generation_tasks WHERE uuid = ?').run(uuid);
  }

  /**
   * 检查任务是否存在
   */
  async exists(uuid: string): Promise<boolean> {
    const db = getDatabase();
    const row = db
      .prepare('SELECT 1 FROM ai_generation_tasks WHERE uuid = ?')
      .get(uuid);
    return !!row;
  }

  /**
   * 转换 ServerDTO 到 PersistenceDTO
   */
  private toPersisteceDTO(dto: AIGenerationTaskServerDTO): AIGenerationTaskPersistenceDTO {
    return {
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      conversationUuid: dto.conversationUuid,
      type: dto.type,
      status: dto.status,
      provider: dto.provider,
      model: dto.model,
      input: JSON.stringify(dto.input),
      result: dto.result ? JSON.stringify(dto.result) : null,
      tokenUsage: dto.tokenUsage ? JSON.stringify(dto.tokenUsage) : null,
      errorMessage: dto.errorMessage,
      retryCount: dto.retryCount,
      maxRetries: dto.maxRetries,
      processingStartedAt: dto.processingStartedAt,
      processingCompletedAt: dto.processingCompletedAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    };
  }

  /**
   * 映射数据库行到 ServerDTO
   */
  private mapToServerDTO(row: AIGenerationTaskRow): AIGenerationTaskServerDTO {
    return {
      uuid: row.uuid,
      accountUuid: row.account_uuid,
      conversationUuid: row.conversation_uuid,
      type: row.type as GenerationTaskType,
      status: row.status as TaskStatus,
      provider: row.provider as any,
      model: row.model as any,
      input: JSON.parse(row.input),
      result: row.result ? JSON.parse(row.result) : null,
      tokenUsage: row.token_usage ? JSON.parse(row.token_usage) : null,
      errorMessage: row.error_message,
      retryCount: row.retry_count,
      maxRetries: row.max_retries,
      processingStartedAt: row.processing_started_at,
      processingCompletedAt: row.processing_completed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
