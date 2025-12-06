/**
 * SQLite AI Conversation Repository
 *
 * 实现 IAIConversationRepository 接口的 SQLite 适配器
 * 遵循 DDD Repository 模式
 */

import type { IAIConversationRepository, AIConversationQueryOptions } from '@dailyuse/domain-server/ai';
import { AIConversation, Message } from '@dailyuse/domain-server/ai';
import type { AIConversationPersistenceDTO, MessagePersistenceDTO } from '@dailyuse/contracts/ai';
import { ConversationStatus } from '@dailyuse/contracts/ai';
import { getDatabase, transaction } from '../../database';

/**
 * Database row types
 */
interface AIConversationRow {
  uuid: string;
  account_uuid: string;
  title: string;
  status: string;
  message_count: number;
  last_message_at: number | null;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

interface MessageRow {
  uuid: string;
  conversation_uuid: string;
  role: string;
  content: string;
  token_count: number | null;
  created_at: number;
}

/**
 * AIConversation SQLite Repository 实现
 */
export class SqliteAIConversationRepository implements IAIConversationRepository {
  /**
   * 保存对话（创建或更新）
   * 注意：级联保存所有消息
   */
  async save(conversation: AIConversation): Promise<void> {
    const db = getDatabase();
    const dto = conversation.toPersistenceDTO();

    transaction(() => {
      const existing = db
        .prepare('SELECT uuid FROM ai_conversations WHERE uuid = ?')
        .get(dto.uuid);

      if (existing) {
        db.prepare(`
          UPDATE ai_conversations SET
            account_uuid = ?,
            title = ?,
            status = ?,
            message_count = ?,
            last_message_at = ?,
            updated_at = ?,
            deleted_at = ?
          WHERE uuid = ?
        `).run(
          dto.accountUuid,
          dto.title,
          dto.status,
          dto.messageCount,
          dto.lastMessageAt,
          dto.updatedAt,
          dto.deletedAt,
          dto.uuid
        );
      } else {
        db.prepare(`
          INSERT INTO ai_conversations (
            uuid, account_uuid, title, status, message_count,
            last_message_at, created_at, updated_at, deleted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          dto.uuid,
          dto.accountUuid,
          dto.title,
          dto.status,
          dto.messageCount,
          dto.lastMessageAt,
          dto.createdAt,
          dto.updatedAt,
          dto.deletedAt
        );
      }

      // 保存消息
      this.saveMessages(conversation);
    });
  }

  /**
   * 保存消息
   */
  private saveMessages(conversation: AIConversation): void {
    const db = getDatabase();
    const messages = conversation.messages;

    for (const message of messages) {
      const messageDto = message.toPersistenceDTO();
      const existing = db
        .prepare('SELECT uuid FROM ai_messages WHERE uuid = ?')
        .get(messageDto.uuid);

      if (!existing) {
        db.prepare(`
          INSERT INTO ai_messages (
            uuid, conversation_uuid, role, content, token_count, created_at
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          messageDto.uuid,
          messageDto.conversationUuid,
          messageDto.role,
          messageDto.content,
          messageDto.tokenCount,
          messageDto.createdAt
        );
      }
    }
  }

  /**
   * 根据 UUID 查找对话
   */
  async findByUuid(
    uuid: string,
    options?: AIConversationQueryOptions
  ): Promise<AIConversation | null> {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM ai_conversations WHERE uuid = ? AND deleted_at IS NULL')
      .get(uuid) as AIConversationRow | undefined;

    if (!row) {
      return null;
    }

    const conversation = this.mapToEntity(row);

    if (options?.includeChildren) {
      const messages = this.loadMessages(uuid);
      messages.forEach((msg) => conversation.addMessage(msg));
    }

    return conversation;
  }

  /**
   * 根据账户 UUID 查找所有对话
   */
  async findByAccountUuid(
    accountUuid: string,
    options?: AIConversationQueryOptions
  ): Promise<AIConversation[]> {
    const db = getDatabase();
    const rows = db
      .prepare(
        'SELECT * FROM ai_conversations WHERE account_uuid = ? AND deleted_at IS NULL ORDER BY updated_at DESC'
      )
      .all(accountUuid) as AIConversationRow[];

    const conversations = rows.map((row) => this.mapToEntity(row));

    if (options?.includeChildren) {
      for (const conversation of conversations) {
        const messages = this.loadMessages(conversation.uuid);
        messages.forEach((msg) => conversation.addMessage(msg));
      }
    }

    return conversations;
  }

  /**
   * 根据状态查找对话
   */
  async findByStatus(
    accountUuid: string,
    status: ConversationStatus,
    options?: AIConversationQueryOptions
  ): Promise<AIConversation[]> {
    const db = getDatabase();
    const rows = db
      .prepare(
        'SELECT * FROM ai_conversations WHERE account_uuid = ? AND status = ? AND deleted_at IS NULL ORDER BY updated_at DESC'
      )
      .all(accountUuid, status) as AIConversationRow[];

    const conversations = rows.map((row) => this.mapToEntity(row));

    if (options?.includeChildren) {
      for (const conversation of conversations) {
        const messages = this.loadMessages(conversation.uuid);
        messages.forEach((msg) => conversation.addMessage(msg));
      }
    }

    return conversations;
  }

  /**
   * 查找最近的对话（分页）
   */
  async findRecent(
    accountUuid: string,
    limit: number,
    offset?: number
  ): Promise<AIConversation[]> {
    const db = getDatabase();
    const rows = db
      .prepare(
        'SELECT * FROM ai_conversations WHERE account_uuid = ? AND deleted_at IS NULL ORDER BY updated_at DESC LIMIT ? OFFSET ?'
      )
      .all(accountUuid, limit, offset ?? 0) as AIConversationRow[];

    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 删除对话（级联删除所有消息）
   */
  async delete(uuid: string): Promise<void> {
    const db = getDatabase();

    transaction(() => {
      db.prepare('DELETE FROM ai_messages WHERE conversation_uuid = ?').run(uuid);
      db.prepare('DELETE FROM ai_conversations WHERE uuid = ?').run(uuid);
    });
  }

  /**
   * 检查对话是否存在
   */
  async exists(uuid: string): Promise<boolean> {
    const db = getDatabase();
    const row = db
      .prepare('SELECT 1 FROM ai_conversations WHERE uuid = ? AND deleted_at IS NULL')
      .get(uuid);
    return !!row;
  }

  /**
   * 加载消息
   */
  private loadMessages(conversationUuid: string): Message[] {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM ai_messages WHERE conversation_uuid = ? ORDER BY created_at ASC')
      .all(conversationUuid) as MessageRow[];

    return rows.map((row) => this.mapMessageToEntity(row));
  }

  /**
   * 映射数据库行到领域对象
   */
  private mapToEntity(row: AIConversationRow): AIConversation {
    const dto: AIConversationPersistenceDTO = {
      uuid: row.uuid,
      accountUuid: row.account_uuid,
      title: row.title,
      status: row.status as ConversationStatus,
      messageCount: row.message_count,
      lastMessageAt: row.last_message_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    };
    return AIConversation.fromPersistenceDTO(dto);
  }

  /**
   * 映射消息数据库行到领域对象
   */
  private mapMessageToEntity(row: MessageRow): Message {
    const dto: MessagePersistenceDTO = {
      uuid: row.uuid,
      conversationUuid: row.conversation_uuid,
      role: row.role as any,
      content: row.content,
      tokenCount: row.token_count,
      createdAt: row.created_at,
    };
    return Message.fromPersistenceDTO(dto);
  }
}
