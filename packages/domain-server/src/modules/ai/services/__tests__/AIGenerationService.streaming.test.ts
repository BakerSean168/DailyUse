/**
 * AIGenerationService Streaming Tests
 * 测试 AI 流式生成功能
 *
 * Story: 3-2 Chat Stream Backend
 * AC-12: Unit tests for streaming service logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIGenerationService } from '../AIGenerationService';
import type { IAIConversationRepository } from '../../repositories/IAIConversationRepository';
import type { IAIUsageQuotaRepository } from '../../repositories/IAIUsageQuotaRepository';
import { AIConversationServer } from '../../aggregates/AIConversationServer';
import { AIUsageQuotaServer } from '../../aggregates/AIUsageQuotaServer';
import { MessageServer } from '../../entities/MessageServer';
import type { AIContracts } from '@dailyuse/contracts';
import { AIAdapterFactory } from '../../infrastructure/adapters/AIAdapterFactory';
import type { BaseAIAdapter, AIStreamCallback } from '../../infrastructure/adapters/BaseAIAdapter';

type MessageRole = AIContracts.MessageRole;

describe('AIGenerationService - Streaming Tests', () => {
  let service: AIGenerationService;
  let mockConversationRepository: IAIConversationRepository;
  let mockQuotaRepository: IAIUsageQuotaRepository;
  let mockAdapter: BaseAIAdapter;

  beforeEach(() => {
    // Mock Conversation Repository
    mockConversationRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByAccountUuid: vi.fn(),
      delete: vi.fn(),
    } as any;

    // Mock Quota Repository
    mockQuotaRepository = {
      findByAccountUuid: vi.fn(),
      save: vi.fn(),
      getOrCreate: vi.fn(),
    } as any;

    // Mock Adapter
    mockAdapter = {
      generateText: vi.fn(),
      generateStream: vi.fn(),
      validate: vi.fn().mockResolvedValue(true),
      getAdapterName: vi.fn().mockReturnValue('MockAdapter'),
      getDefaultModel: vi.fn().mockReturnValue('mock-model'),
    } as any;

    // Mock Adapter Factory - createAdapter is synchronous
    vi.spyOn(AIAdapterFactory, 'createAdapter').mockReturnValue(mockAdapter);

    // Mock Quota Repository responses - return AIUsageQuotaServer instances
    const mockQuota = AIUsageQuotaServer.create({
      accountUuid: 'account-123',
      quotaLimit: 1000,
      resetPeriod: 'daily' as any,
    });
    
    // Consume some quota to simulate usage
    mockQuota.consume(100);

    vi.mocked(mockQuotaRepository.findByAccountUuid).mockResolvedValue(mockQuota);

    service = new AIGenerationService(
      mockConversationRepository,
      mockQuotaRepository,
      AIAdapterFactory,
    );
  });

  describe('generateStream', () => {
    it('should stream response with chunks', async () => {
      // Arrange
      const accountUuid = 'account-123';
      const userMessage = 'Hello AI';
      const chunks = ['Hello', ' there', '!'];
      let accumulatedContent = '';

      const existingConversation = AIConversationServer.create({
        accountUuid,
        title: 'Test Chat',
      });

      vi.mocked(mockConversationRepository.findById).mockResolvedValue(existingConversation);
      vi.mocked(mockConversationRepository.save).mockResolvedValue(undefined);

      // Mock adapter to call callback with chunks
      vi.mocked(mockAdapter.generateStream).mockImplementation(async (input, callback) => {
        callback.onStart?.();
        for (const chunk of chunks) {
          callback.onChunk(chunk);
        }
        // Wait for onComplete to finish (it's async)
        await callback.onComplete({
          content: chunks.join(''),
          tokenUsage: {
            promptTokens: 10,
            completionTokens: 20,
            totalTokens: 30,
          },
          finishReason: 'stop',
        });
      });

      const streamCallback: AIStreamCallback = {
        onStart: vi.fn(),
        onChunk: vi.fn((chunk) => {
          accumulatedContent += chunk;
        }),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      // Act
      await service.generateStream(
        {
          accountUuid,
          conversationUuid: existingConversation.uuid,
          userMessage,
        },
        streamCallback,
      );

      // Assert
      expect(streamCallback.onStart).toHaveBeenCalledTimes(1);
      expect(streamCallback.onChunk).toHaveBeenCalledTimes(chunks.length);
      expect(streamCallback.onChunk).toHaveBeenNthCalledWith(1, 'Hello');
      expect(streamCallback.onChunk).toHaveBeenNthCalledWith(2, ' there');
      expect(streamCallback.onChunk).toHaveBeenNthCalledWith(3, '!');
      expect(accumulatedContent).toBe('Hello there!');
      expect(streamCallback.onComplete).toHaveBeenCalledTimes(1);
      expect(streamCallback.onError).not.toHaveBeenCalled();

      // Verify user message was saved
      expect(mockConversationRepository.save).toHaveBeenCalled();
    });

    it('should create new conversation if none exists', async () => {
      // Arrange
      const accountUuid = 'account-123';
      const userMessage = 'Hello AI';

      vi.mocked(mockConversationRepository.findById).mockResolvedValue(null);
      vi.mocked(mockConversationRepository.save).mockResolvedValue(undefined);

      vi.mocked(mockAdapter.generateStream).mockImplementation(async (input, callback) => {
        callback.onStart?.();
        callback.onChunk('Response');
        await callback.onComplete({
          content: 'Response',
          tokenUsage: { promptTokens: 5, completionTokens: 10, totalTokens: 15 },
          finishReason: 'stop',
        });
      });

      const streamCallback: AIStreamCallback = {
        onChunk: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      // Act
      await service.generateStream(
        {
          accountUuid,
          userMessage,
        },
        streamCallback,
      );

      // Assert - new conversation should be created
      expect(mockConversationRepository.save).toHaveBeenCalled();
      expect(streamCallback.onComplete).toHaveBeenCalled();
    });

    it('should check quota before streaming', async () => {
      // Arrange
      const accountUuid = 'account-123';
      const userMessage = 'Hello';

      // Mock quota exhausted - create quota that is fully consumed
      const exhaustedQuota = AIUsageQuotaServer.create({
        accountUuid,
        quotaLimit: 100,
        resetPeriod: 'daily' as any,
      });
      
      // Consume all quota
      exhaustedQuota.consume(100);

      vi.mocked(mockQuotaRepository.findByAccountUuid).mockResolvedValue(exhaustedQuota);

      const streamCallback: AIStreamCallback = {
        onChunk: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      // Act & Assert
      await expect(
        service.generateStream(
          {
            accountUuid,
            userMessage,
          },
          streamCallback,
        ),
      ).rejects.toThrow('Quota exceeded');

      expect(streamCallback.onChunk).not.toHaveBeenCalled();
      expect(streamCallback.onComplete).not.toHaveBeenCalled();
    });

    it('should handle streaming errors gracefully', async () => {
      // Arrange
      const accountUuid = 'account-123';
      const userMessage = 'Hello';
      const errorMessage = 'Stream generation failed';

      const existingConversation = AIConversationServer.create({
        accountUuid,
        title: 'Test Chat',
      });

      vi.mocked(mockConversationRepository.findById).mockResolvedValue(existingConversation);
      vi.mocked(mockConversationRepository.save).mockResolvedValue(undefined);

      // Mock adapter to throw error
      vi.mocked(mockAdapter.generateStream).mockImplementation(async (input, callback) => {
        callback.onStart?.();
        callback.onChunk('Partial');
        callback.onError(new Error(errorMessage));
      });

      const streamCallback: AIStreamCallback = {
        onStart: vi.fn(),
        onChunk: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      // Act
      await service.generateStream(
        {
          accountUuid,
          conversationUuid: existingConversation.uuid,
          userMessage,
        },
        streamCallback,
      );

      // Assert
      expect(streamCallback.onStart).toHaveBeenCalled();
      expect(streamCallback.onChunk).toHaveBeenCalledWith('Partial');
      expect(streamCallback.onError).toHaveBeenCalledWith(expect.any(Error));
      expect(streamCallback.onComplete).not.toHaveBeenCalled();

      // Conversation should be soft-deleted on error
      expect(mockConversationRepository.save).toHaveBeenCalled();
    });

    it('should include conversation history in prompt', async () => {
      // Arrange
      const accountUuid = 'account-123';
      const userMessage = 'Follow-up question';

      const existingConversation = AIConversationServer.create({
        accountUuid,
        title: 'Test Chat',
      });

      // Add existing messages to conversation using MessageServer.create
      const msg1 = MessageServer.create({
        conversationUuid: existingConversation.uuid,
        role: 'user' as MessageRole,
        content: 'First message',
      });

      const msg2 = MessageServer.create({
        conversationUuid: existingConversation.uuid,
        role: 'assistant' as MessageRole,
        content: 'First response',
      });

      existingConversation.addMessage(msg1);
      existingConversation.addMessage(msg2);

      vi.mocked(mockConversationRepository.findById).mockResolvedValue(existingConversation);
      vi.mocked(mockConversationRepository.save).mockResolvedValue(undefined);

      vi.mocked(mockAdapter.generateStream).mockImplementation(async (input, callback) => {
        // Verify prompt includes history
        expect(input.prompt).toContain('First message');
        expect(input.prompt).toContain('First response');
        expect(input.prompt).toContain('Follow-up question');

        callback.onStart?.();
        callback.onChunk('Response');
        await callback.onComplete({
          content: 'Response',
          tokenUsage: { promptTokens: 10, completionTokens: 15, totalTokens: 25 },
          finishReason: 'stop',
        });
      });

      const streamCallback: AIStreamCallback = {
        onChunk: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      // Act
      await service.generateStream(
        {
          accountUuid,
          conversationUuid: existingConversation.uuid,
          userMessage,
        },
        streamCallback,
      );

      // Assert
      expect(mockAdapter.generateStream).toHaveBeenCalled();
      expect(streamCallback.onComplete).toHaveBeenCalled();
    });

    it('should consume quota after successful stream completion', async () => {
      // Arrange
      const accountUuid = 'account-123';
      const userMessage = 'Hello';
      const tokensUsed = 30;

      const existingConversation = AIConversationServer.create({
        accountUuid,
        title: 'Test Chat',
      });

      vi.mocked(mockConversationRepository.findById).mockResolvedValue(existingConversation);
      vi.mocked(mockConversationRepository.save).mockResolvedValue(undefined);

      vi.mocked(mockAdapter.generateStream).mockImplementation(async (input, callback) => {
        callback.onStart?.();
        callback.onChunk('Response');
        await callback.onComplete({
          content: 'Response',
          tokenUsage: {
            promptTokens: 10,
            completionTokens: 20,
            totalTokens: tokensUsed,
          },
          finishReason: 'stop',
        });
      });

      const streamCallback: AIStreamCallback = {
        onChunk: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      // Act
      await service.generateStream(
        {
          accountUuid,
          conversationUuid: existingConversation.uuid,
          userMessage,
        },
        streamCallback,
      );

      // Assert - quota should be consumed after completion
      expect(streamCallback.onComplete).toHaveBeenCalled();
      // Verify quota repository was called to save updated usage
      expect(mockQuotaRepository.save).toHaveBeenCalled();
    });

    it('should save assistant message after stream completes', async () => {
      // Arrange
      const accountUuid = 'account-123';
      const userMessage = 'Hello';
      const fullResponse = 'Hello there!';

      const existingConversation = AIConversationServer.create({
        accountUuid,
        title: 'Test Chat',
      });

      // Track all conversation saves
      const savedConversations: AIConversationServer[] = [];

      vi.mocked(mockConversationRepository.findById).mockResolvedValue(existingConversation);
      vi.mocked(mockConversationRepository.save).mockImplementation(async (conversation) => {
        savedConversations.push(conversation);
        return Promise.resolve();
      });

      vi.mocked(mockAdapter.generateStream).mockImplementation(async (input, callback) => {
        callback.onStart?.();
        callback.onChunk('Hello');
        callback.onChunk(' there');
        callback.onChunk('!');
        await callback.onComplete({
          content: fullResponse,
          tokenUsage: { promptTokens: 5, completionTokens: 10, totalTokens: 15 },
          finishReason: 'stop',
        });
      });

      const streamCallback: AIStreamCallback = {
        onChunk: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      };

      // Act
      await service.generateStream(
        {
          accountUuid,
          conversationUuid: existingConversation.uuid,
          userMessage,
        },
        streamCallback,
      );

      // Assert
      expect(mockConversationRepository.save).toHaveBeenCalled();
      expect(streamCallback.onComplete).toHaveBeenCalled();

      // Verify the conversation has the assistant message
      // Save is called twice: once for user message, once for assistant message
      expect(savedConversations.length).toBeGreaterThan(0);
      const lastSavedConversation = savedConversations[savedConversations.length - 1];
      const messages = lastSavedConversation.getAllMessages();
      const assistantMessages = messages.filter((m) => m.role.toUpperCase() === 'ASSISTANT');
      expect(assistantMessages.length).toBeGreaterThan(0);
      expect(assistantMessages[assistantMessages.length - 1].content).toBe(fullResponse);
    });
  });
});
