// @ts-nocheck
/**
 * Prisma AI Conversation Repository
 * Prisma AI 对话仓储实现
 *
 * 职责：
 * - 操作 ai_conversations 和 ai_messages 表
 * - ServerDTO ↔ Prisma Model 映射
 * - 聚合根模式：级联操作消息
 *
 * TODO: 完整实现 + 数据库 migration 应用后修复类型错误
 */

import { PrismaClient } from '@prisma/client';
import type { IAIConversationRepository } from '@dailyuse/domain-server';
import type { AIContracts } from '@dailyuse/contracts';
import { ConversationStatus } from '@dailyuse/contracts';

type AIConversationServerDTO = AIContracts.AIConversationServerDTO;

/**
 * PrismaAIConversationRepository 实现（TODO）
 */
export class PrismaAIConversationRepository implements IAIConversationRepository {
  constructor(private prisma: PrismaClient) {}

  async save(conversation: AIConversationServerDTO): Promise<void> {
    throw new Error('Not implemented yet');
  }

  async findByUuid(
    uuid: string,
    includeMessages?: boolean,
  ): Promise<AIConversationServerDTO | null> {
    throw new Error('Not implemented yet');
  }

  async findByAccountUuid(accountUuid: string): Promise<AIConversationServerDTO[]> {
    throw new Error('Not implemented yet');
  }

  async findByStatus(
    accountUuid: string,
    status: ConversationStatus,
  ): Promise<AIConversationServerDTO[]> {
    throw new Error('Not implemented yet');
  }

  async findRecent(
    accountUuid: string,
    limit: number,
    offset?: number,
  ): Promise<AIConversationServerDTO[]> {
    throw new Error('Not implemented yet');
  }

  async delete(uuid: string): Promise<void> {
    throw new Error('Not implemented yet');
  }

  async exists(uuid: string): Promise<boolean> {
    throw new Error('Not implemented yet');
  }
}
