/**
 * AI Generation Service
 *
 * Domain service that orchestrates the complete AI generation workflow:
 * 1. Validate input
 * 2. Check quota availability
 * 3. Invoke AI adapter
 * 4. Record usage
 * 5. Publish domain events
 */

import { AIContracts } from '@dailyuse/contracts';
import type { IAIConversationRepository } from '../repositories/IAIConversationRepository';
import type { IAIUsageQuotaRepository } from '../repositories/IAIUsageQuotaRepository';
import { AIConversationServer } from '../aggregates/AIConversationServer';
import { MessageServer } from '../entities/MessageServer';
import { QuotaEnforcementService, QuotaExceededError } from './QuotaEnforcementService';
import { AIAdapterFactory } from '../infrastructure/adapters/AIAdapterFactory';
import type { BaseAIAdapter } from '../infrastructure/adapters/BaseAIAdapter';
import type {
  AIGenerationResult,
  AIStreamCallback,
} from '../infrastructure/adapters/BaseAIAdapter';

type GenerationInputServerDTO = AIContracts.GenerationInputServerDTO;
type MessageRole = AIContracts.MessageRole;
type ConversationStatus = AIContracts.ConversationStatus;

const MessageRoleEnum = AIContracts.MessageRole;
const ConversationStatusEnum = AIContracts.ConversationStatus;

export class GenerationFailedError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
    public readonly conversationUuid?: string,
  ) {
    super(message);
    this.name = 'GenerationFailedError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export interface GenerationRequest {
  accountUuid: string;
  conversationUuid?: string; // Optional: create new if not provided
  userMessage: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export interface GenerationResponse {
  conversationUuid: string;
  userMessageUuid: string;
  assistantMessageUuid: string;
  content: string;
  tokensUsed: number;
  quotaRemaining: number;
}

export class AIGenerationService {
  private readonly quotaService: QuotaEnforcementService;
  private adapter: BaseAIAdapter | null = null;

  constructor(
    private readonly conversationRepository: IAIConversationRepository,
    private readonly quotaRepository: IAIUsageQuotaRepository,
    private readonly adapterFactory: typeof AIAdapterFactory = AIAdapterFactory,
  ) {
    this.quotaService = new QuotaEnforcementService(quotaRepository);
  }

  /**
   * Generate AI response synchronously
   */
  async generateText(request: GenerationRequest): Promise<GenerationResponse> {
    // 1. Validate input
    this.validateRequest(request);

    // 2. Check quota
    const quotaCheck = await this.quotaService.checkQuota(request.accountUuid, 1);
    if (!quotaCheck.allowed) {
      throw new QuotaExceededError(
        `Quota exceeded: ${quotaCheck.reason}`,
        request.accountUuid,
        quotaCheck.currentUsage,
        quotaCheck.quotaLimit,
      );
    }

    // 3. Get or create conversation
    const conversation = await this.getOrCreateConversation(request);

    try {
      // 4. Add user message
      const userMessage = MessageServer.create({
        conversationUuid: conversation.uuid,
        role: MessageRoleEnum.USER,
        content: request.userMessage,
      });
      conversation.addMessage(userMessage);
      await this.conversationRepository.save(conversation);

      // 5. Generate AI response
      const adapter = await this.getAdapter();

      // Convert messages to prompt format
      const messagesPrompt = conversation
        .getAllMessages()
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join('\n\n');
      const userPrompt = `${messagesPrompt}\n\nuser: ${request.userMessage}`;

      const generationInput: GenerationInputServerDTO = {
        prompt: userPrompt,
        systemPrompt: request.systemPrompt,
        taskType: AIContracts.GenerationTaskType.GENERAL_CHAT,
        maxTokens: request.maxTokens,
        temperature: request.temperature,
      };

      const result = await adapter.generateText(generationInput);

      // 6. Add assistant message
      const assistantMessage = MessageServer.create({
        conversationUuid: conversation.uuid,
        role: MessageRoleEnum.ASSISTANT,
        content: result.content,
      });
      conversation.addMessage(assistantMessage);
      await this.conversationRepository.save(conversation);

      // 7. Consume quota
      const tokensUsed = result.tokenUsage?.totalTokens ?? 1;
      await this.quotaService.consumeQuota(request.accountUuid, tokensUsed);

      // 8. Get updated quota status
      const quotaStatus = await this.quotaService.getQuotaStatus(request.accountUuid);

      // 9. Publish domain event (handled by aggregate)
      // The conversation aggregate already publishes 'ai.conversation.message.added' events

      return {
        conversationUuid: conversation.uuid,
        userMessageUuid: userMessage.uuid,
        assistantMessageUuid: assistantMessage.uuid,
        content: result.content,
        tokensUsed,
        quotaRemaining: quotaStatus.remainingQuota,
      };
    } catch (error) {
      // Rollback: Mark conversation as failed if it exists
      if (conversation) {
        conversation.softDelete();
        await this.conversationRepository.save(conversation);
      }

      if (error instanceof QuotaExceededError) {
        throw error;
      }

      throw new GenerationFailedError(
        `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined,
        conversation?.uuid,
      );
    }
  }

  /**
   * Generate AI response with streaming
   */
  async generateStream(
    request: GenerationRequest,
    streamCallback: AIStreamCallback,
  ): Promise<void> {
    // 1. Validate input
    this.validateRequest(request);

    // 2. Check quota
    const quotaCheck = await this.quotaService.checkQuota(request.accountUuid, 1);
    if (!quotaCheck.allowed) {
      throw new QuotaExceededError(
        `Quota exceeded: ${quotaCheck.reason}`,
        request.accountUuid,
        quotaCheck.currentUsage,
        quotaCheck.quotaLimit,
      );
    }

    // 3. Get or create conversation
    const conversation = await this.getOrCreateConversation(request);

    try {
      // 4. Add user message
      const userMessage = MessageServer.create({
        conversationUuid: conversation.uuid,
        role: MessageRoleEnum.USER,
        content: request.userMessage,
      });
      conversation.addMessage(userMessage);
      await this.conversationRepository.save(conversation);

      // 5. Generate AI response with streaming
      const adapter = await this.getAdapter();

      // Convert messages to prompt format
      const messagesPrompt = conversation
        .getAllMessages()
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join('\n\n');
      const userPrompt = `${messagesPrompt}\n\nuser: ${request.userMessage}`;

      const generationInput: GenerationInputServerDTO = {
        prompt: userPrompt,
        systemPrompt: request.systemPrompt,
        taskType: AIContracts.GenerationTaskType.GENERAL_CHAT,
        maxTokens: request.maxTokens,
        temperature: request.temperature,
      };

      let fullContent = '';

      await adapter.generateStream(generationInput, {
        onStart: () => {
          streamCallback.onStart?.();
        },
        onChunk: (chunk: string) => {
          fullContent += chunk;
          streamCallback.onChunk(chunk);
        },
        onComplete: async (result: AIGenerationResult) => {
          try {
            // 6. Add assistant message
            const assistantMessage = MessageServer.create({
              conversationUuid: conversation.uuid,
              role: MessageRoleEnum.ASSISTANT,
              content: fullContent || result.content,
            });
            conversation.addMessage(assistantMessage);
            await this.conversationRepository.save(conversation);

            // 7. Consume quota
            const tokensUsed = result.tokenUsage?.totalTokens ?? 1;
            await this.quotaService.consumeQuota(request.accountUuid, tokensUsed);

            streamCallback.onComplete(result);
          } catch (error) {
            streamCallback.onError(
              error instanceof Error
                ? error
                : new Error('Failed to save assistant message or consume quota'),
            );
          }
        },
        onError: async (error: Error) => {
          // Rollback: Mark conversation as failed
          conversation.softDelete();
          await this.conversationRepository.save(conversation);
          streamCallback.onError(error);
        },
      });
    } catch (error) {
      // Rollback: Mark conversation as failed
      if (conversation) {
        conversation.softDelete();
        await this.conversationRepository.save(conversation);
      }

      throw new GenerationFailedError(
        `Stream generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined,
        conversation?.uuid,
      );
    }
  }

  /**
   * Validate generation request
   */
  private validateRequest(request: GenerationRequest): void {
    if (!request.accountUuid) {
      throw new ValidationError('accountUuid is required', 'accountUuid');
    }

    if (!request.userMessage || request.userMessage.trim().length === 0) {
      throw new ValidationError('userMessage cannot be empty', 'userMessage');
    }

    if (request.userMessage.length > 10000) {
      throw new ValidationError('userMessage is too long (max 10000 chars)', 'userMessage');
    }

    if (request.maxTokens && (request.maxTokens < 1 || request.maxTokens > 4096)) {
      throw new ValidationError('maxTokens must be between 1 and 4096', 'maxTokens');
    }

    if (request.temperature && (request.temperature < 0 || request.temperature > 2)) {
      throw new ValidationError('temperature must be between 0 and 2', 'temperature');
    }
  }

  /**
   * Get or create conversation
   */
  private async getOrCreateConversation(request: GenerationRequest): Promise<AIConversationServer> {
    if (request.conversationUuid) {
      const existing = await this.conversationRepository.findById(request.conversationUuid, {
        includeChildren: true,
      });
      if (existing) {
        return existing;
      }
    }

    // Create new conversation
    const title = this.generateTitle(request.userMessage);
    const conversation = AIConversationServer.create({
      accountUuid: request.accountUuid,
      title,
    });

    await this.conversationRepository.save(conversation);
    return conversation;
  }

  /**
   * Generate conversation title from first message
   */
  private generateTitle(message: string): string {
    const maxLength = 50;
    if (message.length <= maxLength) {
      return message;
    }
    return message.substring(0, maxLength - 3) + '...';
  }

  /**
   * Get AI adapter instance
   */
  private async getAdapter(): Promise<BaseAIAdapter> {
    if (!this.adapter) {
      this.adapter = this.adapterFactory.createAdapter();
      const isValid = await this.adapter.validate();
      if (!isValid) {
        throw new GenerationFailedError('AI adapter validation failed');
      }
    }
    return this.adapter;
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(accountUuid: string): Promise<AIConversationServer[]> {
    return this.conversationRepository.findByAccountUuid(accountUuid, {
      includeChildren: true,
    });
  }

  /**
   * Get specific conversation
   */
  async getConversation(conversationUuid: string): Promise<AIConversationServer | null> {
    return this.conversationRepository.findById(conversationUuid, {
      includeChildren: true,
    });
  }
}
