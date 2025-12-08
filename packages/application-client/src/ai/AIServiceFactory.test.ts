/**
 * AI Service Factory - 整合测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIServiceFactory } from '../../AIServiceFactory';
import type { IAIService } from '@dailyuse/contracts/ai';

describe('AIServiceFactory', () => {
  beforeEach(() => {
    // 清理工厂状态
    AIServiceFactory.clear();
  });

  describe('registerProvider & getProvider', () => {
    it('应该注册和检索自定义提供商', () => {
      const mockProvider: IAIService = {
        decomposeGoal: vi.fn(),
        estimateTaskTime: vi.fn(),
        suggestPriority: vi.fn(),
        isAvailable: vi.fn().mockResolvedValue(true),
      };

      AIServiceFactory.registerProvider('mock', mockProvider);
      const provider = AIServiceFactory.getProvider('mock');

      expect(provider).toEqual(mockProvider);
    });

    it('应该在提供商不存在时返回undefined', () => {
      const provider = AIServiceFactory.getProvider('nonexistent');
      expect(provider).toBeUndefined();
    });
  });

  describe('getDefaultProvider', () => {
    it('应该在初始化时返回默认提供商', () => {
      const mockProvider: IAIService = {
        decomposeGoal: vi.fn(),
        estimateTaskTime: vi.fn(),
        suggestPriority: vi.fn(),
        isAvailable: vi.fn().mockResolvedValue(true),
      };

      AIServiceFactory.registerProvider('openai', mockProvider);
      AIServiceFactory.initialize({
        provider: 'openai',
        apiKey: 'test-key',
      });

      const provider = AIServiceFactory.getDefaultProvider();
      expect(provider).toBeDefined();
    });

    it('应该在未初始化时抛出错误', () => {
      expect(() => {
        AIServiceFactory.getDefaultProvider();
      }).toThrow('Factory not initialized');
    });
  });

  describe('hasProvider', () => {
    it('应该检查提供商是否已注册', () => {
      const mockProvider: IAIService = {
        decomposeGoal: vi.fn(),
        estimateTaskTime: vi.fn(),
        suggestPriority: vi.fn(),
        isAvailable: vi.fn().mockResolvedValue(true),
      };

      AIServiceFactory.registerProvider('mock', mockProvider);

      expect(AIServiceFactory.hasProvider('mock')).toBe(true);
      expect(AIServiceFactory.hasProvider('nonexistent')).toBe(false);
    });
  });

  describe('getAvailableProviders', () => {
    it('应该返回所有可用的提供商', () => {
      const mockProvider: IAIService = {
        decomposeGoal: vi.fn(),
        estimateTaskTime: vi.fn(),
        suggestPriority: vi.fn(),
        isAvailable: vi.fn().mockResolvedValue(true),
      };

      const mockProvider2: IAIService = {
        decomposeGoal: vi.fn(),
        estimateTaskTime: vi.fn(),
        suggestPriority: vi.fn(),
        isAvailable: vi.fn().mockResolvedValue(true),
      };

      AIServiceFactory.registerProvider('mock1', mockProvider);
      AIServiceFactory.registerProvider('mock2', mockProvider2);

      const providers = AIServiceFactory.getAvailableProviders();
      expect(providers).toContain('mock1');
      expect(providers).toContain('mock2');
    });
  });

  describe('clear', () => {
    it('应该清除所有已注册的提供商', () => {
      const mockProvider: IAIService = {
        decomposeGoal: vi.fn(),
        estimateTaskTime: vi.fn(),
        suggestPriority: vi.fn(),
        isAvailable: vi.fn().mockResolvedValue(true),
      };

      AIServiceFactory.registerProvider('mock', mockProvider);
      AIServiceFactory.clear();

      expect(() => {
        AIServiceFactory.getDefaultProvider();
      }).toThrow();
    });
  });
});
