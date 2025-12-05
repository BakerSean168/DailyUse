/**
 * Delete Conversation Service
 *
 * 删除对话应用服务
 */

import type { IAIConversationRepository } from '@dailyuse/domain-server/ai';
import { eventBus } from '@dailyuse/utils';
import { AIContainer } from '@dailyuse/infrastructure-server';

/**
 * Delete Conversation Input
 */
export interface DeleteConversationInput {
  uuid: string;
  accountUuid: string;
}

/**
 * Delete Conversation Service
 */
export class DeleteConversation {
  private static instance: DeleteConversation;

  private constructor(private readonly conversationRepository: IAIConversationRepository) {}

  static createInstance(conversationRepository?: IAIConversationRepository): DeleteConversation {
    const container = AIContainer.getInstance();
    const repo = conversationRepository || container.getConversationRepository();
    DeleteConversation.instance = new DeleteConversation(repo);
    return DeleteConversation.instance;
  }

  static getInstance(): DeleteConversation {
    if (!DeleteConversation.instance) {
      DeleteConversation.instance = DeleteConversation.createInstance();
    }
    return DeleteConversation.instance;
  }

  static resetInstance(): void {
    DeleteConversation.instance = undefined as unknown as DeleteConversation;
  }

  async execute(input: DeleteConversationInput): Promise<void> {
    const conversation = await this.conversationRepository.findByUuid(input.uuid);
    
    if (!conversation) {
      return; // 已删除视为成功
    }

    if (conversation.accountUuid !== input.accountUuid) {
      throw new Error('Not authorized to delete this conversation');
    }

    await this.conversationRepository.delete(input.uuid);

    await eventBus.emit('AIConversationDeleted', {
      uuid: input.uuid,
      accountUuid: input.accountUuid,
    });
  }
}

export const deleteConversation = (input: DeleteConversationInput): Promise<void> =>
  DeleteConversation.getInstance().execute(input);
