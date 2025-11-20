import type { AIConversationServer } from '../aggregates/AIConversationServer';

export interface IAIConversationRepository {
  save(conversation: AIConversationServer): Promise<void>;
  findById(
    uuid: string,
    options?: { includeChildren?: boolean },
  ): Promise<AIConversationServer | null>;
  findByAccountUuid(
    accountUuid: string,
    options?: { includeChildren?: boolean },
  ): Promise<AIConversationServer[]>;
  delete(uuid: string): Promise<void>;
}
