/**
 * MockAIAdapter Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { MockAIAdapter } from '../MockAIAdapter';
import type { AIStreamCallback } from '../BaseAIAdapter';
import type { AIContracts } from '@dailyuse/contracts';

type GenerationInputServerDTO = AIContracts.GenerationInputServerDTO;

describe('MockAIAdapter', () => {
  it('should instantiate with default config', () => {
    const adapter = new MockAIAdapter();
    expect(adapter.getAdapterName()).toBe('MockAIAdapter');
  });

  it('should always validate successfully', async () => {
    const adapter = new MockAIAdapter();
    const isValid = await adapter.validate();
    expect(isValid).toBe(true);
  });

  describe('generateText', () => {
    it('should generate text for GOAL_KEY_RESULTS', async () => {
      const adapter = new MockAIAdapter({ delayMs: 0 });

      const input: GenerationInputServerDTO = {
        prompt: 'Generate KRs for my goal',
        taskType: 'GOAL_KEY_RESULTS',
        systemPrompt: null,
        temperature: null,
        maxTokens: null,
        contextData: null,
      };

      const result = await adapter.generateText(input);

      expect(result.content).toContain('Key Results');
      expect(result.tokenUsage).toBeDefined();
      expect(result.tokenUsage?.totalTokens).toBeGreaterThan(0);
      expect(result.finishReason).toBe('stop');
      expect(result.metadata?.mock).toBe(true);
    });

    it('should generate text for GENERAL_CHAT', async () => {
      const adapter = new MockAIAdapter({ delayMs: 0 });

      const input: GenerationInputServerDTO = {
        prompt: 'Hello, how are you?',
        taskType: 'GENERAL_CHAT',
        systemPrompt: null,
        temperature: null,
        maxTokens: null,
        contextData: null,
      };

      const result = await adapter.generateText(input);

      expect(result.content).toBeTruthy();
      expect(result.tokenUsage).toBeDefined();
    });

    it('should include system prompt in response if provided', async () => {
      const adapter = new MockAIAdapter({ delayMs: 0 });

      const input: GenerationInputServerDTO = {
        prompt: 'Test prompt',
        systemPrompt: 'You are a helpful assistant',
        taskType: 'GENERAL_CHAT',
        temperature: null,
        maxTokens: null,
        contextData: null,
      };

      const result = await adapter.generateText(input);

      expect(result.content).toContain('You are a helpful assistant');
    });
  });

  describe('generateStream', () => {
    it('should stream text word by word', async () => {
      const adapter = new MockAIAdapter({ delayMs: 0 });

      const input: GenerationInputServerDTO = {
        prompt: 'Generate something',
        taskType: 'GENERAL_CHAT',
        systemPrompt: null,
        temperature: null,
        maxTokens: null,
        contextData: null,
      };

      const chunks: string[] = [];
      let completed = false;
      let started = false;

      const callback: AIStreamCallback = {
        onStart: () => {
          started = true;
        },
        onChunk: (chunk: string) => {
          chunks.push(chunk);
        },
        onComplete: (result) => {
          completed = true;
          expect(result.content).toBeTruthy();
          expect(result.tokenUsage).toBeDefined();
        },
        onError: (error) => {
          throw error;
        },
      };

      await adapter.generateStream(input, callback);

      expect(started).toBe(true);
      expect(chunks.length).toBeGreaterThan(0);
      expect(completed).toBe(true);
    });

    it('should handle errors in streaming', async () => {
      const adapter = new MockAIAdapter({ delayMs: 0 });

      // Force an error by mocking the getMockResponse method
      const originalMethod = (adapter as any).getMockResponse;
      (adapter as any).getMockResponse = () => {
        throw new Error('Test error');
      };

      const input: GenerationInputServerDTO = {
        prompt: 'Test',
        taskType: 'GENERAL_CHAT',
        systemPrompt: null,
        temperature: null,
        maxTokens: null,
        contextData: null,
      };

      let errorCaught = false;

      const callback: AIStreamCallback = {
        onChunk: () => {},
        onComplete: () => {},
        onError: (error) => {
          errorCaught = true;
          expect(error.message).toBe('Test error');
        },
      };

      await adapter.generateStream(input, callback);

      expect(errorCaught).toBe(true);

      // Restore original method
      (adapter as any).getMockResponse = originalMethod;
    });
  });
});
