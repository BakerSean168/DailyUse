/**
 * Create Conversation Service
 *
 * 创建 AI 对话应用服务
 */

import type { IAIConversationRepository } from '@dailyuse/domain-server/ai';
import { AIConversation } from '@dailyuse/domain-server/ai';
import type { CreateConversationRequest, ConversationResponse } from '@dailyuse/contracts/ai';
import { eventBus } from '@dailyuse/utils';
import { AIContainer } from '@dailyuse/infrastructure-server';

/**
 * Create Conversation Input
 */
export interface CreateConversationInput extends CreateConversationRequest {
  accountUuid: string;
}

/**
 * Create Conversation Output
 */
export type CreateConversationOutput = ConversationResponse;

/**
 * Create Conversation Service
 */
export class CreateConversation {
  private static instance: CreateConversation;

  private constructor(private readonly conversationRepository: IAIConversationRepository) {}

  static createInstance(conversationRepository?: IAIConversationRepository): CreateConversation {
    const container = AIContainer.getInstance();
    const repo = conversationRepository || container.getConversationRepository();
    CreateConversation.instance = new CreateConversation(repo);
    return CreateConversation.instance;
  }

  static getInstance(): CreateConversation {
    if (!CreateConversation.instance) {
      CreateConversation.instance = CreateConversation.createInstance();
    }
    return CreateConversation.instance;
  }

  static resetInstance(): void {
    CreateConversation.instance = undefined as unknown as CreateConversation;
  }

  async execute(input: CreateConversationInput): Promise<CreateConversationOutput> {
    // 1. 创建对话
    const conversation = AIConversation.create({
      accountUuid: input.accountUuid,
      title: input.title || 'New Conversation',
    });

    // 2. 保存
    await this.conversationRepository.save(conversation);

    // 3. 发布事件
    const events = conversation.getUncommittedDomainEvents();
    for (const event of events) {
      await eventBus.emit(event.eventType, event);
    }

    return {
      conversation: conversation.toClientDTO(),
    };
  }
}

export const createConversation = (input: CreateConversationInput): Promise<CreateConversationOutput> =>
  CreateConversation.getInstance().execute(input);
