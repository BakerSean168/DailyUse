/**
 * AIGenerationService Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIContracts } from '@dailyuse/contracts';
import {
  AIGenerationService,
  GenerationFailedError,
  ValidationError,
} from '../AIGenerationService';
import { QuotaExceededError } from '../QuotaEnforcementService';
import { AIConversationServer } from '../../aggregates/AIConversationServer';
import { AIUsageQuotaServer } from '../../aggregates/AIUsageQuotaServer';
import type { IAIConversationRepository } from '../../repositories/IAIConversationRepository';
import type { IAIUsageQuotaRepository } from '../../repositories/IAIUsageQuotaRepository';
import { AIAdapterFactory } from '../../infrastructure/adapters/AIAdapterFactory';
import { MockAIAdapter } from '../../infrastructure/adapters/MockAIAdapter';

const QuotaResetPeriodEnum = AIContracts.QuotaResetPeriod;
const MessageRoleEnum = AIContracts.MessageRole;

describe('AIGenerationService', () => {
  let service: AIGenerationService;
  let mockConversationRepo: IAIConversationRepository;
  let mockQuotaRepo: IAIUsageQuotaRepository;
  let mockAdapter: MockAIAdapter;

  beforeEach(() => {
    mockConversationRepo = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(null),
      findByAccountUuid: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    mockQuotaRepo = {
      save: vi.fn().mockResolvedValue(undefined),
      findByAccountUuid: vi.fn().mockResolvedValue(null),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    mockAdapter = new MockAIAdapter();
    vi.spyOn(AIAdapterFactory, 'createAdapter').mockReturnValue(mockAdapter);

    service = new AIGenerationService(mockConversationRepo, mockQuotaRepo, AIAdapterFactory);
  });

  describe('generateText', () => {
    it('should successfully generate text response', async () => {
      const quota = AIUsageQuotaServer.create({
        accountUuid: 'user-123',
        quotaLimit: 50,
        resetPeriod: QuotaResetPeriodEnum.DAILY,
      });
      vi.spyOn(mockQuotaRepo, 'findByAccountUuid').mockResolvedValue(quota);

      const response = await service.generateText({
        accountUuid: 'user-123',
        userMessage: 'Hello AI',
      });

      expect(response.content).toBeTruthy();
      expect(response.conversationUuid).toBeTruthy();
      expect(response.userMessageUuid).toBeTruthy();
      expect(response.assistantMessageUuid).toBeTruthy();
      expect(mockConversationRepo.save).toHaveBeenCalled();
      expect(quota.currentUsage).toBeGreaterThan(0);
    });

    it('should throw ValidationError for empty message', async () => {
      await expect(
        service.generateText({
          accountUuid: 'user-123',
          userMessage: '',
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for missing accountUuid', async () => {
      await expect(
        service.generateText({
          accountUuid: '',
          userMessage: 'Hello',
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for message too long', async () => {
      await expect(
        service.generateText({
          accountUuid: 'user-123',
          userMessage: 'a'.repeat(10001),
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw QuotaExceededError when quota is insufficient', async () => {
      const quota = AIUsageQuotaServer.create({
        accountUuid: 'user-123',
        quotaLimit: 10,
        resetPeriod: QuotaResetPeriodEnum.DAILY,
      });
      quota.consume(10); // Use all quota
      vi.spyOn(mockQuotaRepo, 'findByAccountUuid').mockResolvedValue(quota);

      await expect(
        service.generateText({
          accountUuid: 'user-123',
          userMessage: 'Hello',
        }),
      ).rejects.toThrow(QuotaExceededError);
    });

    it('should use existing conversation when conversationUuid provided', async () => {
      const quota = AIUsageQuotaServer.create({
        accountUuid: 'user-123',
        quotaLimit: 100, // Increased to accommodate mock response
        resetPeriod: QuotaResetPeriodEnum.DAILY,
      });
      vi.spyOn(mockQuotaRepo, 'findByAccountUuid').mockResolvedValue(quota);

      const existingConversation = AIConversationServer.create({
        accountUuid: 'user-123',
        title: 'Existing Chat',
      });
      vi.spyOn(mockConversationRepo, 'findById').mockResolvedValue(existingConversation);

      const response = await service.generateText({
        accountUuid: 'user-123',
        conversationUuid: existingConversation.uuid,
        userMessage: 'Follow-up question',
      });

      expect(response.conversationUuid).toBe(existingConversation.uuid);
    });

    it('should create new conversation when conversationUuid not provided', async () => {
      const quota = AIUsageQuotaServer.create({
        accountUuid: 'user-123',
        quotaLimit: 50,
        resetPeriod: QuotaResetPeriodEnum.DAILY,
      });
      vi.spyOn(mockQuotaRepo, 'findByAccountUuid').mockResolvedValue(quota);

      const response = await service.generateText({
        accountUuid: 'user-123',
        userMessage: 'Hello AI',
      });

      expect(response.conversationUuid).toBeTruthy();
      expect(mockConversationRepo.save).toHaveBeenCalled();
    });

    it('should include system prompt in generation', async () => {
      const quota = AIUsageQuotaServer.create({
        accountUuid: 'user-123',
        quotaLimit: 100, // Increased to accommodate mock response
        resetPeriod: QuotaResetPeriodEnum.DAILY,
      });
      vi.spyOn(mockQuotaRepo, 'findByAccountUuid').mockResolvedValue(quota);

      const generateTextSpy = vi.spyOn(mockAdapter, 'generateText');

      await service.generateText({
        accountUuid: 'user-123',
        userMessage: 'Hello',
        systemPrompt: 'You are a helpful assistant',
      });

      expect(generateTextSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          systemPrompt: 'You are a helpful assistant',
        }),
      );
    });

    it('should handle generation errors gracefully', async () => {
      const quota = AIUsageQuotaServer.create({
        accountUuid: 'user-123',
        quotaLimit: 50,
        resetPeriod: QuotaResetPeriodEnum.DAILY,
      });
      vi.spyOn(mockQuotaRepo, 'findByAccountUuid').mockResolvedValue(quota);

      // Mock adapter to throw error
      vi.spyOn(mockAdapter, 'generateText').mockRejectedValue(new Error('API Error'));

      await expect(
        service.generateText({
          accountUuid: 'user-123',
          userMessage: 'Hello',
        }),
      ).rejects.toThrow(GenerationFailedError);
    });
  });

  describe('generateStream', () => {
    it('should successfully stream text response', async () => {
      const quota = AIUsageQuotaServer.create({
        accountUuid: 'user-123',
        quotaLimit: 50,
        resetPeriod: QuotaResetPeriodEnum.DAILY,
      });
      vi.spyOn(mockQuotaRepo, 'findByAccountUuid').mockResolvedValue(quota);

      const chunks: string[] = [];
      let completed = false;

      const streamPromise = service.generateStream(
        {
          accountUuid: 'user-123',
          userMessage: 'Hello AI',
        },
        {
          onChunk: (chunk) => {
            chunks.push(chunk);
          },
          onComplete: () => {
            completed = true;
          },
          onError: () => {},
        },
      );

      // Wait for stream to complete
      await streamPromise;

      // Give async operations time to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(chunks.length).toBeGreaterThan(0);
      expect(completed).toBe(true);
      expect(mockConversationRepo.save).toHaveBeenCalled();
    });

    it('should call onStart callback', async () => {
      const quota = AIUsageQuotaServer.create({
        accountUuid: 'user-123',
        quotaLimit: 50,
        resetPeriod: QuotaResetPeriodEnum.DAILY,
      });
      vi.spyOn(mockQuotaRepo, 'findByAccountUuid').mockResolvedValue(quota);

      let started = false;

      await service.generateStream(
        {
          accountUuid: 'user-123',
          userMessage: 'Hello',
        },
        {
          onStart: () => {
            started = true;
          },
          onChunk: () => {},
          onComplete: () => {},
          onError: () => {},
        },
      );

      expect(started).toBe(true);
    });

    it('should handle streaming errors', async () => {
      const quota = AIUsageQuotaServer.create({
        accountUuid: 'user-123',
        quotaLimit: 50,
        resetPeriod: QuotaResetPeriodEnum.DAILY,
      });
      vi.spyOn(mockQuotaRepo, 'findByAccountUuid').mockResolvedValue(quota);

      // Mock adapter to throw error during streaming
      vi.spyOn(mockAdapter, 'generateStream').mockImplementation(async (input, callback) => {
        callback.onError(new Error('Stream error'));
      });

      let errorCaught = false;

      await service.generateStream(
        {
          accountUuid: 'user-123',
          userMessage: 'Hello',
        },
        {
          onChunk: () => {},
          onComplete: () => {},
          onError: () => {
            errorCaught = true;
          },
        },
      );

      expect(errorCaught).toBe(true);
    });
  });

  describe('getConversationHistory', () => {
    it('should retrieve conversation history for account', async () => {
      const conversations = [
        AIConversationServer.create({
          accountUuid: 'user-123',
          title: 'Chat 1',
        }),
        AIConversationServer.create({
          accountUuid: 'user-123',
          title: 'Chat 2',
        }),
      ];
      vi.spyOn(mockConversationRepo, 'findByAccountUuid').mockResolvedValue(conversations);

      const history = await service.getConversationHistory('user-123');

      expect(history).toHaveLength(2);
      expect(mockConversationRepo.findByAccountUuid).toHaveBeenCalledWith('user-123', {
        includeChildren: true,
      });
    });
  });

  describe('getConversation', () => {
    it('should retrieve specific conversation', async () => {
      const conversation = AIConversationServer.create({
        accountUuid: 'user-123',
        title: 'Test Chat',
      });
      vi.spyOn(mockConversationRepo, 'findById').mockResolvedValue(conversation);

      const result = await service.getConversation(conversation.uuid);

      expect(result).toBeTruthy();
      expect(result?.uuid).toBe(conversation.uuid);
      expect(mockConversationRepo.findById).toHaveBeenCalledWith(conversation.uuid, {
        includeChildren: true,
      });
    });

    it('should return null for non-existent conversation', async () => {
      vi.spyOn(mockConversationRepo, 'findById').mockResolvedValue(null);

      const result = await service.getConversation('non-existent-uuid');

      expect(result).toBeNull();
    });
  });
});
