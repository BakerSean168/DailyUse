import { aiConversationApiClient } from '../../infrastructure/api/aiConversationApiClient';
import type { ConversationDto } from '@dailyuse/contracts';

/**
 * AI Conversation Application Service
 * Pattern A: ApplicationService only handles API calls and DTO transformation
 * UI feedback (success/error messages) should be handled by Composables
 */
export class AIConversationApplicationService {
  private static instance: AIConversationApplicationService;

  private constructor() {}

  public static getInstance(): AIConversationApplicationService {
    if (!AIConversationApplicationService.instance) {
      AIConversationApplicationService.instance = new AIConversationApplicationService();
    }
    return AIConversationApplicationService.instance;
  }

  /**
   * List conversations with pagination
   */
  async listConversations(params: { page: number; limit: number }): Promise<ConversationDto[]> {
    return await aiConversationApiClient.listConversations(params);
  }

  /**
   * Delete a conversation by UUID
   */
  async deleteConversation(uuid: string): Promise<void> {
    await aiConversationApiClient.deleteConversation(uuid);
  }
}

// Singleton instance for easy import
export const aiConversationApplicationService = AIConversationApplicationService.getInstance();
