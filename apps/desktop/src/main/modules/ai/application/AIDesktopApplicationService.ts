/**
 * AI Desktop Application Service
 *
 * 包装 @dailyuse/application-server/ai 的所有 Use Cases
 * 为 Desktop IPC handlers 提供统一的应用服务入口
 */

import {
  createConversation,
  listConversations,
  getConversation,
  deleteConversation,
  sendMessage,
  getQuota,
  generateGoal,
  listProviders,
  type CreateConversationInput,
  type CreateConversationOutput,
  type ListConversationsInput,
  type ListConversationsOutput,
  type GetConversationInput,
  type GetConversationOutput,
  type DeleteConversationInput,
  type SendMessageInput,
  type SendMessageOutput,
  type GetQuotaInput,
  type GetQuotaOutput,
  type GenerateGoalInput,
  type GenerateGoalOutput,
  type ListProvidersInput,
  type ListProvidersOutput,
  AIContainer,
} from '@dailyuse/application-server';

import type {
  AIConversationClientDTO,
  MessageClientDTO,
  AIUsageQuotaClientDTO,
  AIProviderConfigClientDTO,
} from '@dailyuse/contracts/ai';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AIDesktopAppService');

export class AIDesktopApplicationService {
  constructor() {
    // Container should be initialized by infrastructure module
  }

  // ===== Conversation =====

  /**
   * 创建对话
   */
  async createConversation(
    accountUuid: string,
    title?: string,
  ): Promise<CreateConversationOutput> {
    logger.debug('Creating conversation', { accountUuid, title });
    return createConversation({ accountUuid, title: title || 'New Conversation' });
  }

  /**
   * 列出对话
   */
  async listConversations(
    accountUuid: string,
    options?: { limit?: number; offset?: number; archived?: boolean },
  ): Promise<ListConversationsOutput> {
    logger.debug('Listing conversations', { accountUuid, options });
    return listConversations({
      accountUuid,
      ...options,
    });
  }

  /**
   * 获取对话详情
   */
  async getConversation(
    accountUuid: string,
    conversationUuid: string,
    includeMessages = false,
  ): Promise<GetConversationOutput> {
    logger.debug('Getting conversation', { accountUuid, conversationUuid });
    return getConversation({
      accountUuid,
      uuid: conversationUuid,
    });
  }

  /**
   * 删除对话
   */
  async deleteConversation(
    accountUuid: string,
    conversationUuid: string,
  ): Promise<void> {
    logger.debug('Deleting conversation', { accountUuid, conversationUuid });
    await deleteConversation({ accountUuid, uuid: conversationUuid });
  }

  /**
   * 更新对话
   */
  async updateConversation(
    accountUuid: string,
    conversationUuid: string,
    updates: { title?: string; archived?: boolean },
  ): Promise<AIConversationClientDTO | null> {
    logger.debug('Updating conversation', { accountUuid, conversationUuid, updates });
    // TODO: Implement updateConversation in application-server
    // For now, return the updated conversation
    const result = await getConversation({ accountUuid, uuid: conversationUuid });
    return result.conversation;
  }

  /**
   * 归档对话
   */
  async archiveConversation(
    accountUuid: string,
    conversationUuid: string,
  ): Promise<{ success: boolean }> {
    logger.debug('Archiving conversation', { accountUuid, conversationUuid });
    // TODO: Implement archiveConversation
    return { success: true };
  }

  /**
   * 搜索对话
   */
  async searchConversations(
    accountUuid: string,
    query: string,
    options?: { limit?: number; offset?: number },
  ): Promise<{ conversations: AIConversationClientDTO[]; total: number }> {
    logger.debug('Searching conversations', { accountUuid, query });
    // TODO: Implement search in application-server
    const result = await listConversations({ accountUuid, ...options });
    const filtered = result.conversations.filter(
      (c) => c.title?.toLowerCase().includes(query.toLowerCase()),
    );
    return { conversations: filtered, total: filtered.length };
  }

  // ===== Message =====

  /**
   * 发送消息
   */
  async sendMessage(
    accountUuid: string,
    conversationUuid: string,
    content: string,
  ): Promise<SendMessageOutput> {
    logger.debug('Sending message', { accountUuid, conversationUuid });
    return sendMessage({ accountUuid, conversationUuid, content });
  }

  /**
   * 列出消息
   */
  async listMessages(
    accountUuid: string,
    conversationUuid: string,
    options?: { limit?: number; offset?: number },
  ): Promise<{ messages: MessageClientDTO[]; total: number }> {
    logger.debug('Listing messages', { accountUuid, conversationUuid });
    // Get conversation with messages
    const result = await getConversation({
      accountUuid,
      uuid: conversationUuid,
    });
    const messages = result.conversation?.messages || [];
    return { messages, total: messages.length };
  }

  /**
   * 获取消息
   */
  async getMessage(
    accountUuid: string,
    messageUuid: string,
  ): Promise<MessageClientDTO | null> {
    logger.debug('Getting message', { accountUuid, messageUuid });
    // TODO: Implement getMessage
    return null;
  }

  /**
   * 删除消息
   */
  async deleteMessage(
    accountUuid: string,
    messageUuid: string,
  ): Promise<{ success: boolean }> {
    logger.debug('Deleting message', { accountUuid, messageUuid });
    // TODO: Implement deleteMessage
    return { success: true };
  }

  /**
   * 重新生成消息
   */
  async regenerateMessage(
    accountUuid: string,
    messageUuid: string,
  ): Promise<{ uuid: string }> {
    logger.debug('Regenerating message', { accountUuid, messageUuid });
    // TODO: Implement regenerateMessage
    return { uuid: 'new-uuid' };
  }

  /**
   * 编辑消息
   */
  async editMessage(
    accountUuid: string,
    messageUuid: string,
    content: string,
  ): Promise<{ success: boolean }> {
    logger.debug('Editing message', { accountUuid, messageUuid });
    // TODO: Implement editMessage
    return { success: true };
  }

  /**
   * 消息反馈
   */
  async messageFeedback(
    accountUuid: string,
    messageUuid: string,
    feedback: 'positive' | 'negative',
  ): Promise<{ success: boolean }> {
    logger.debug('Message feedback', { accountUuid, messageUuid, feedback });
    // TODO: Implement messageFeedback
    return { success: true };
  }

  // ===== Generation Task =====

  /**
   * 创建生成任务
   */
  async createGenerationTask(
    accountUuid: string,
    request: { type: string; input: any },
  ): Promise<{ uuid: string; status: string }> {
    logger.debug('Creating generation task', { accountUuid, type: request.type });
    // TODO: Implement generation task management
    return { uuid: 'todo', status: 'pending' };
  }

  /**
   * 列出生成任务
   */
  async listGenerationTasks(
    accountUuid: string,
    options?: { limit?: number; offset?: number },
  ): Promise<{ tasks: any[]; total: number }> {
    logger.debug('Listing generation tasks', { accountUuid });
    return { tasks: [], total: 0 };
  }

  /**
   * 获取生成任务
   */
  async getGenerationTask(
    accountUuid: string,
    taskUuid: string,
  ): Promise<any | null> {
    logger.debug('Getting generation task', { accountUuid, taskUuid });
    return null;
  }

  /**
   * 取消生成任务
   */
  async cancelGenerationTask(
    accountUuid: string,
    taskUuid: string,
  ): Promise<{ success: boolean }> {
    logger.debug('Cancelling generation task', { accountUuid, taskUuid });
    return { success: true };
  }

  /**
   * 重试生成任务
   */
  async retryGenerationTask(
    accountUuid: string,
    taskUuid: string,
  ): Promise<{ success: boolean }> {
    logger.debug('Retrying generation task', { accountUuid, taskUuid });
    return { success: true };
  }

  /**
   * 获取生成任务状态
   */
  async getGenerationTaskStatus(
    accountUuid: string,
    taskUuid: string,
  ): Promise<{ status: string; progress: number }> {
    logger.debug('Getting generation task status', { accountUuid, taskUuid });
    return { status: 'unknown', progress: 0 };
  }

  // ===== Goal Generation =====

  /**
   * 生成目标
   */
  async generateGoal(
    accountUuid: string,
    input: Omit<GenerateGoalInput, 'accountUuid'>,
  ): Promise<GenerateGoalOutput> {
    logger.debug('Generating goal', { accountUuid });
    return generateGoal({ accountUuid, ...input });
  }

  // ===== Quota =====

  /**
   * 获取配额
   */
  async getQuota(accountUuid: string): Promise<GetQuotaOutput> {
    logger.debug('Getting quota', { accountUuid });
    return getQuota({ accountUuid });
  }

  /**
   * 获取使用历史
   */
  async getUsageHistory(
    accountUuid: string,
    options?: { startDate?: Date; endDate?: Date },
  ): Promise<{ usages: any[]; total: number }> {
    logger.debug('Getting usage history', { accountUuid });
    // TODO: Implement getUsageHistory
    return { usages: [], total: 0 };
  }

  /**
   * 按模型获取配额
   */
  async getQuotaByModel(
    accountUuid: string,
    modelId: string,
  ): Promise<{ used: number; limit: number }> {
    logger.debug('Getting quota by model', { accountUuid, modelId });
    // TODO: Implement getQuotaByModel
    return { used: 0, limit: 0 };
  }

  // ===== Provider =====

  /**
   * 列出提供商
   */
  async listProviders(accountUuid: string): Promise<ListProvidersOutput> {
    logger.debug('Listing providers', { accountUuid });
    return listProviders({ accountUuid });
  }

  /**
   * 获取提供商
   */
  async getProvider(
    accountUuid: string,
    providerId: string,
  ): Promise<AIProviderConfigClientDTO | null> {
    logger.debug('Getting provider', { accountUuid, providerId });
    const result = await listProviders({ accountUuid });
    return result.providers.find((p) => p.uuid === providerId) || null;
  }

  /**
   * 获取提供商模型
   */
  async getProviderModels(
    accountUuid: string,
    providerId: string,
  ): Promise<{ models: any[] }> {
    logger.debug('Getting provider models', { accountUuid, providerId });
    // TODO: Implement getProviderModels
    return { models: [] };
  }

  /**
   * 设置默认提供商
   */
  async setDefaultProvider(
    accountUuid: string,
    providerId: string,
  ): Promise<{ success: boolean }> {
    logger.debug('Setting default provider', { accountUuid, providerId });
    // TODO: Implement setDefaultProvider
    return { success: true };
  }

  /**
   * 配置提供商
   */
  async configureProvider(
    accountUuid: string,
    providerId: string,
    config: any,
  ): Promise<{ success: boolean }> {
    logger.debug('Configuring provider', { accountUuid, providerId });
    // TODO: Implement configureProvider
    return { success: true };
  }

  /**
   * 测试提供商连接
   */
  async testProviderConnection(
    accountUuid: string,
    providerId: string,
  ): Promise<{ success: boolean; latency: number }> {
    logger.debug('Testing provider connection', { accountUuid, providerId });
    // TODO: Implement testProviderConnection
    return { success: true, latency: 0 };
  }
}
