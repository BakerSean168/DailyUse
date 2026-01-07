/**
 * AI Application Service - Renderer
 *
 * AI 模块应用服务层
 * 封装 @dailyuse/application-client 的 AI Use Cases
 */

import {
  // Conversation
  createConversation,
  listConversations,
  getConversation,
  updateConversation,
  deleteConversation,
  closeConversation,
  archiveConversation,
  // Message
  sendMessage,
  listMessages,
  deleteMessage,
  streamChat,
  // Generation
  generateGoal,
  generateGoalWithKeyResults,
  aiGenerateKeyResults,
  // Quota
  getQuota,
  checkQuotaAvailability,
  // Provider
  listProviders,
  createProvider,
  testProviderConnection,
  setDefaultProvider,
  // Types
  type CreateConversationInput,
  type ListConversationsInput,
  type ListConversationsOutput,
  type UpdateConversationInput,
  type SendMessageInput,
  type ListMessagesInput,
  type ListMessagesOutput,
  type StreamChatInput,
  type GenerateGoalInput,
  type GenerateGoalWithKeyResultsInput,
  type CreateProviderInput,
  type TestProviderConnectionInput,
} from '@dailyuse/application-client';

import { AIContainer } from '@dailyuse/infrastructure-client';
import type { UpdateAIProviderRequest } from '@dailyuse/contracts/ai';

/**
 * AI 应用服务
 *
 * 提供 AI 相关的所有业务操作
 * 返回类型与 @dailyuse/application-client 保持一致
 */
export class AIApplicationService {
  // ===== Conversation Operations =====

  /**
   * 创建对话
   */
  createConversation(input: CreateConversationInput) {
    return createConversation(input);
  }

  /**
   * 获取对话列表
   */
  listConversations(input?: ListConversationsInput): Promise<ListConversationsOutput> {
    return listConversations(input);
  }

  /**
   * 获取单个对话
   */
  getConversation(conversationUuid: string) {
    return getConversation(conversationUuid);
  }

  /**
   * 更新对话
   */
  updateConversation(input: UpdateConversationInput) {
    return updateConversation(input);
  }

  /**
   * 删除对话
   */
  deleteConversation(conversationUuid: string) {
    return deleteConversation(conversationUuid);
  }

  /**
   * 关闭对话
   */
  closeConversation(conversationUuid: string) {
    return closeConversation(conversationUuid);
  }

  /**
   * 归档对话
   */
  archiveConversation(conversationUuid: string) {
    return archiveConversation(conversationUuid);
  }

  // ===== Message Operations =====

  /**
   * 发送消息
   */
  sendMessage(input: SendMessageInput) {
    return sendMessage(input);
  }

  /**
   * 获取消息列表
   */
  listMessages(input: ListMessagesInput): Promise<ListMessagesOutput> {
    return listMessages(input);
  }

  /**
   * 删除消息
   */
  deleteMessage(messageUuid: string) {
    return deleteMessage(messageUuid);
  }

  /**
   * 流式聊天
   */
  streamChat(input: StreamChatInput) {
    return streamChat(input);
  }

  // ===== Generation Operations =====

  /**
   * 生成目标
   */
  generateGoal(input: GenerateGoalInput) {
    return generateGoal(input);
  }

  /**
   * 生成目标和关键结果
   */
  generateGoalWithKeyResults(input: GenerateGoalWithKeyResultsInput) {
    return generateGoalWithKeyResults(input);
  }

  /**
   * 生成关键结果
   */
  generateKeyResults(goalDescription: string) {
    return aiGenerateKeyResults(goalDescription);
  }

  // ===== Quota Operations =====

  /**
   * 获取配额信息
   */
  getQuota() {
    return getQuota();
  }

  /**
   * 检查配额可用性
   * @param tokensNeeded 需要的 token 数量
   */
  checkQuotaAvailability(tokensNeeded: number) {
    return checkQuotaAvailability(tokensNeeded);
  }

  // ===== Provider Operations =====

  /**
   * 获取 AI 提供商列表
   */
  listProviders() {
    return listProviders();
  }

  /**
   * 创建 AI 提供商
   */
  createProvider(input: CreateProviderInput) {
    return createProvider(input);
  }

  /**
   * 测试提供商连接
   */
  testProviderConnection(input: TestProviderConnectionInput) {
    return testProviderConnection(input);
  }

  /**
   * 设置默认提供商
   */
  setDefaultProvider(providerUuid: string) {
    return setDefaultProvider(providerUuid);
  }

  // ===== Provider Extended Operations (via infrastructure-client) =====

  /**
   * 获取提供商详情
   */
  getProvider(providerUuid: string) {
    return AIContainer.getInstance().getProviderConfigApiClient().getProviderById(providerUuid);
  }

  /**
   * 更新提供商配置
   */
  updateProvider(providerUuid: string, request: UpdateAIProviderRequest) {
    return AIContainer.getInstance().getProviderConfigApiClient().updateProvider(providerUuid, request);
  }

  /**
   * 删除提供商
   */
  deleteProvider(providerUuid: string) {
    return AIContainer.getInstance().getProviderConfigApiClient().deleteProvider(providerUuid);
  }

  /**
   * 刷新提供商模型列表
   */
  refreshModels(providerUuid: string) {
    return AIContainer.getInstance().getProviderConfigApiClient().refreshModels(providerUuid);
  }
}

/**
 * AI 应用服务单例
 */
export const aiApplicationService = new AIApplicationService();
