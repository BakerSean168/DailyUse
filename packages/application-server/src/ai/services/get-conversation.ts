/**
 * Get Conversation Service
 *
 * 获取单个对话应用服务
 */

import type { IAIConversationRepository } from '@dailyuse/domain-server/ai';
import type { ConversationResponse } from '@dailyuse/contracts/ai';
import { AIContainer } from '../AIContainer';

/**
 * Get Conversation Input
 */
export interface GetConversationInput {
  uuid: string;
  accountUuid: string;
}

/**
 * Get Conversation Output
 */
export type GetConversationOutput = ConversationResponse;

/**
 * Get Conversation Service
 */
export class GetConversation {
  private static instance: GetConversation;

  private constructor(private readonly conversationRepository: IAIConversationRepository) {}

  static createInstance(conversationRepository?: IAIConversationRepository): GetConversation {
    const container = AIContainer.getInstance();
    const repo = conversationRepository || container.getConversationRepository();
    GetConversation.instance = new GetConversation(repo);
    return GetConversation.instance;
  }

  static getInstance(): GetConversation {
    if (!GetConversation.instance) {
      GetConversation.instance = GetConversation.createInstance();
    }
    return GetConversation.instance;
  }

  static resetInstance(): void {
    GetConversation.instance = undefined as unknown as GetConversation;
  }

  async execute(input: GetConversationInput): Promise<GetConversationOutput> {
    const conversation = await this.conversationRepository.findByUuid(input.uuid);

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (conversation.accountUuid !== input.accountUuid) {
      throw new Error('Not authorized to access this conversation');
    }

    return {
      conversation: conversation.toClientDTO(),
    };
  }
}

export const getConversation = (input: GetConversationInput): Promise<GetConversationOutput> =>
  GetConversation.getInstance().execute(input);
