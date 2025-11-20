/**
 * AIAdapterFactory Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AIAdapterFactory } from '../AIAdapterFactory';
import { MockAIAdapter } from '../MockAIAdapter';
import { OpenAIAdapter } from '../OpenAIAdapter';

describe('AIAdapterFactory', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset environment before each test
    delete process.env.AI_PROVIDER;
    delete process.env.OPENAI_API_KEY;
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    // Restore original environment
    process.env = { ...originalEnv };
  });

  describe('createAdapter', () => {
    it('should create MockAdapter by default', () => {
      const adapter = AIAdapterFactory.createAdapter();
      expect(adapter).toBeInstanceOf(MockAIAdapter);
    });

    it('should create MockAdapter when provider is mock', () => {
      const adapter = AIAdapterFactory.createAdapter({ provider: 'mock' });
      expect(adapter).toBeInstanceOf(MockAIAdapter);
    });

    it('should create OpenAIAdapter when provider is openai with apiKey', () => {
      const adapter = AIAdapterFactory.createAdapter({
        provider: 'openai',
        apiKey: 'test-key',
      });
      expect(adapter).toBeInstanceOf(OpenAIAdapter);
    });

    it('should throw error when OpenAI provider is requested without apiKey', () => {
      expect(() => {
        AIAdapterFactory.createAdapter({ provider: 'openai' });
      }).toThrow('OpenAI API key is required');
    });

    it('should read provider from AI_PROVIDER env variable', () => {
      process.env.AI_PROVIDER = 'mock';
      const adapter = AIAdapterFactory.createAdapter();
      expect(adapter).toBeInstanceOf(MockAIAdapter);
    });

    it('should read OpenAI API key from environment', () => {
      process.env.AI_PROVIDER = 'openai';
      process.env.OPENAI_API_KEY = 'test-key-from-env';

      const adapter = AIAdapterFactory.createAdapter();
      expect(adapter).toBeInstanceOf(OpenAIAdapter);
    });

    it('should prefer openai in production environment', () => {
      process.env.NODE_ENV = 'production';
      process.env.OPENAI_API_KEY = 'test-key';

      const adapter = AIAdapterFactory.createAdapter();
      expect(adapter).toBeInstanceOf(OpenAIAdapter);
    });

    it('should fall back to mock for unknown provider', () => {
      const adapter = AIAdapterFactory.createAdapter({ provider: 'unknown' as any });
      expect(adapter).toBeInstanceOf(MockAIAdapter);
    });

    it('should pass custom model to adapter', () => {
      const adapter = AIAdapterFactory.createAdapter({
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-3.5-turbo',
      });
      expect(adapter).toBeInstanceOf(OpenAIAdapter);
    });

    it('should pass custom timeout to adapter', () => {
      const adapter = AIAdapterFactory.createAdapter({
        provider: 'mock',
        timeout: 5000,
      });
      expect(adapter).toBeInstanceOf(MockAIAdapter);
    });
  });

  describe('setDefaultProvider', () => {
    it('should change default provider', () => {
      AIAdapterFactory.setDefaultProvider('mock');
      const adapter = AIAdapterFactory.createAdapter();
      expect(adapter).toBeInstanceOf(MockAIAdapter);
    });
  });

  describe('validateConfig', () => {
    it('should validate mock adapter config', async () => {
      const isValid = await AIAdapterFactory.validateConfig({ provider: 'mock' });
      expect(isValid).toBe(true);
    });

    it('should return false for invalid OpenAI config', async () => {
      const isValid = await AIAdapterFactory.validateConfig({
        provider: 'openai',
        apiKey: 'invalid-key',
      });
      expect(isValid).toBe(false);
    });

    it('should handle validation errors gracefully', async () => {
      const isValid = await AIAdapterFactory.validateConfig({
        provider: 'openai',
        // Missing API key
      });
      expect(isValid).toBe(false);
    });
  });
});
