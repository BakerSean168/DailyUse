/**
 * OpenAI Provider - 单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpenAIProvider } from '../OpenAIProvider';
import type { DecompositionRequest } from '@dailyuse/contracts/goal';

// Mock the 'ai' module
vi.mock('ai', () => ({
  generateObject: vi.fn(),
}));

vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn(() => ({
    modelId: 'gpt-4-turbo',
  })),
}));

import { generateObject } from 'ai';

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new OpenAIProvider({
      provider: 'openai',
      apiKey: mockApiKey,
      model: 'gpt-4-turbo',
    });
  });

  describe('constructor', () => {
    it('应该在没有API key时抛出错误', () => {
      expect(() => {
        new OpenAIProvider({
          provider: 'openai',
          apiKey: undefined,
        });
      }).toThrow('OpenAI API key is required');
    });

    it('应该使用提供的配置初始化', () => {
      const config = {
        provider: 'openai' as const,
        apiKey: mockApiKey,
        model: 'gpt-4',
        maxTokens: 4096,
        temperature: 0.8,
      };
      const p = new OpenAIProvider(config);
      expect(p).toBeDefined();
    });
  });

  describe('decomposeGoal', () => {
    it('应该成功分解目标', async () => {
      const mockResult = {
        object: {
          tasks: [
            {
              title: '学习基础',
              description: '学习基础概念',
              estimatedMinutes: 30,
              complexity: 'simple' as const,
              dependencies: [],
              suggestedOrder: 1,
            },
          ],
          timeline: {
            totalEstimatedHours: 0.5,
            estimatedDays: 1,
          },
          risks: [],
          confidence: 0.9,
        },
      };

      vi.mocked(generateObject).mockResolvedValue(mockResult);

      const request: DecompositionRequest = {
        goalId: 'goal-1',
        goalTitle: 'Learn TypeScript',
        goalDescription: 'Master TypeScript features',
      };

      const result = await provider.decomposeGoal(request);

      expect(result).toEqual(mockResult.object);
      expect(generateObject).toHaveBeenCalled();
    });

    it('应该处理API错误', async () => {
      const error = new Error('API Error');
      vi.mocked(generateObject).mockRejectedValue(error);

      const request: DecompositionRequest = {
        goalId: 'goal-1',
        goalTitle: 'Learn TypeScript',
        goalDescription: 'Master TypeScript features',
      };

      await expect(provider.decomposeGoal(request)).rejects.toThrow(
        'Failed to decompose goal: API Error'
      );
    });

    it('应该传递正确的提示词', async () => {
      vi.mocked(generateObject).mockResolvedValue({
        object: {
          tasks: [],
          timeline: { totalEstimatedHours: 0 },
          risks: [],
        },
      });

      const request: DecompositionRequest = {
        goalId: 'goal-1',
        goalTitle: 'Learn TypeScript',
        goalDescription: 'Master TypeScript features',
      };

      await provider.decomposeGoal(request);

      const callArgs = vi.mocked(generateObject).mock.calls[0][0];
      expect(callArgs.system).toContain('专业的项目管理');
      expect(callArgs.prompt).toContain('Learn TypeScript');
    });
  });

  describe('estimateTaskTime', () => {
    it('应该成功估计任务时间', async () => {
      const mockResult = {
        object: {
          estimatedMinutes: 45,
          confidence: 0.85,
          reasoning: 'Based on task complexity',
        },
      };

      vi.mocked(generateObject).mockResolvedValue(mockResult);

      const result = await provider.estimateTaskTime('Complete project setup');

      expect(result).toEqual({
        estimatedMinutes: 45,
        confidence: 0.85,
      });
    });

    it('应该处理时间估计错误', async () => {
      const error = new Error('Estimation failed');
      vi.mocked(generateObject).mockRejectedValue(error);

      await expect(provider.estimateTaskTime('Task')).rejects.toThrow(
        'Failed to estimate task time: Estimation failed'
      );
    });
  });

  describe('suggestPriority', () => {
    it('应该成功建议优先级', async () => {
      const mockResult = {
        object: {
          priorities: [
            { title: 'Task 1', priority: 9, reasoning: 'Urgent' },
            { title: 'Task 2', priority: 5, reasoning: 'Medium' },
          ],
          overallStrategy: 'Focus on urgent tasks first',
        },
      };

      vi.mocked(generateObject).mockResolvedValue(mockResult);

      const tasks = [
        { title: 'Task 1', description: 'Urgent task' },
        { title: 'Task 2', description: 'Regular task' },
      ];

      const result = await provider.suggestPriority(tasks);

      expect(result.priorities).toHaveLength(2);
      expect(result.reasoning).toBeDefined();
    });
  });

  describe('isAvailable', () => {
    it('应该在服务可用时返回true', async () => {
      vi.mocked(generateObject).mockResolvedValue({
        object: { status: 'ok' },
      });

      const available = await provider.isAvailable();

      expect(available).toBe(true);
    });

    it('应该在服务不可用时返回false', async () => {
      vi.mocked(generateObject).mockRejectedValue(new Error('Service unavailable'));

      const available = await provider.isAvailable();

      expect(available).toBe(false);
    });
  });
});
