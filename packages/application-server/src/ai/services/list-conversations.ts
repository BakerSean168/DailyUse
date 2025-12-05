/**
 * List Conversations Service
 *
 * 获取对话列表应用服务
 */

import type { IAIConversationRepository } from '@dailyuse/domain-server/ai';
import type { ConversationListResponse } from '@dailyuse/contracts/ai';
import { AIContainer } from '@dailyuse/infrastructure-server';

/**
 * List Conversations Input
 */
export interface ListConversationsInput {
  accountUuid: string;
  limit?: number;
  offset?: number;
}

/**
 * List Conversations Output
 */
export type ListConversationsOutput = ConversationListResponse;

/**
 * List Conversations Service
 */
export class ListConversations {
  private static instance: ListConversations;

  private constructor(private readonly conversationRepository: IAIConversationRepository) {}

  static createInstance(conversationRepository?: IAIConversationRepository): ListConversations {
    const container = AIContainer.getInstance();
    const repo = conversationRepository || container.getConversationRepository();
    ListConversations.instance = new ListConversations(repo);
    return ListConversations.instance;
  }

  static getInstance(): ListConversations {
    if (!ListConversations.instance) {
      ListConversations.instance = ListConversations.createInstance();
    }
    return ListConversations.instance;
  }

  static resetInstance(): void {
    ListConversations.instance = undefined as unknown as ListConversations;
  }

  async execute(input: ListConversationsInput): Promise<ListConversationsOutput> {
    const limit = input.limit ?? 20;
    const offset = input.offset ?? 0;

    const conversations = await this.conversationRepository.findRecent(
      input.accountUuid,
      limit,
      offset,
    );

    return {
      conversations: conversations.map((c) => c.toClientDTO()),
      total: conversations.length,
    };
  }
}

export const listConversations = (input: ListConversationsInput): Promise<ListConversationsOutput> =>
  ListConversations.getInstance().execute(input);
