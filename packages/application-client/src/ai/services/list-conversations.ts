/**
 * List Conversations
 *
 * 获取 AI 对话列表用例
 */

import type { IAIConversationApiClient } from '@dailyuse/infrastructure-client';
import type { ConversationListResponse } from '@dailyuse/contracts/ai';
import { AIConversation } from '@dailyuse/domain-client/ai';
import { AIContainer } from '@dailyuse/infrastructure-client';

/**
 * List Conversations Input
 */
export interface ListConversationsInput {
  page?: number;
  pageSize?: number;
  status?: string;
}

/**
 * List Conversations Output
 */
export interface ListConversationsOutput {
  conversations: AIConversation[];
  total: number;
}

/**
 * List Conversations
 */
export class ListConversations {
  private static instance: ListConversations;

  private constructor(private readonly apiClient: IAIConversationApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAIConversationApiClient): ListConversations {
    const container = AIContainer.getInstance();
    const client = apiClient || container.getConversationApiClient();
    ListConversations.instance = new ListConversations(client);
    return ListConversations.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ListConversations {
    if (!ListConversations.instance) {
      ListConversations.instance = ListConversations.createInstance();
    }
    return ListConversations.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ListConversations.instance = undefined as unknown as ListConversations;
  }

  /**
   * 执行用例
   */
  async execute(input: ListConversationsInput = {}): Promise<ListConversationsOutput> {
    const response = await this.apiClient.getConversations(input);
    return {
      conversations: response.conversations.map((dto) => AIConversation.fromClientDTO(dto)),
      total: response.total,
    };
  }
}

/**
 * 便捷函数
 */
export const listConversations = (input?: ListConversationsInput): Promise<ListConversationsOutput> =>
  ListConversations.getInstance().execute(input);
