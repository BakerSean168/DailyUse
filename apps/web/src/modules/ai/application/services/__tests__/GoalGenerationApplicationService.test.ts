/**
 * GoalGenerationApplicationService Unit Tests
 * 目标生成应用服务单元测试
 *
 * 测试范围：
 * - generateGoal() - 从想法生成目标
 * - generateGoalWithKRs() - 从想法生成目标 + 关键结果
 * - 输入验证
 * - 错误处理
 * - 状态管理
 */

import { describe, it, expect, beforeEach, vi, afterEach, type Mock } from 'vitest';
import { GoalGenerationApplicationService } from '../GoalGenerationApplicationService';
import { goalGenerationApiClient } from '../../../infrastructure/api/goalGenerationApiClient';
import type {
  GenerateGoalResponse,
  GenerateGoalWithKRsResponse,
  GeneratedGoalDraft,
  KeyResultPreview,
} from '@dailyuse/contracts/ai';
import { GoalCategory } from '@dailyuse/contracts/ai';

// Mock dependencies
vi.mock('../../../infrastructure/api/goalGenerationApiClient', () => ({
  goalGenerationApiClient: {
    generateGoal: vi.fn(),
    generateGoalWithKRs: vi.fn(),
  },
}));

vi.mock('@dailyuse/ui', () => ({
  useMessage: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

vi.mock('@dailyuse/utils', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  }),
}));

describe('GoalGenerationApplicationService', () => {
  let service: GoalGenerationApplicationService;

  // Mock 响应数据
  const mockGoalDraft: GeneratedGoalDraft = {
    title: '提升英语口语能力',
    description: '通过每日练习和实际对话场景，在三个月内显著提升英语口语流利度和自信心',
    motivation: '为了更好的职业发展和国际交流机会',
    category: GoalCategory.LEARNING,
    suggestedStartDate: Date.now(),
    suggestedEndDate: Date.now() + 90 * 24 * 60 * 60 * 1000,
    importance: 3,
    urgency: 2,
    tags: ['英语', '学习', '口语'],
    feasibilityAnalysis: '通过每日 30 分钟练习，目标可行性高',
    aiInsights: '建议结合影子跟读和实际对话练习',
  };

  const mockKeyResults: KeyResultPreview[] = [
    {
      title: '完成 100 小时英语对话练习',
      description: '使用语言交换 App 进行真人对话练习',
      targetValue: 100,
      unit: '小时',
      weight: 40,
    },
    {
      title: '雅思口语模拟测试达到 6.5 分',
      description: '每月进行一次模拟测试',
      targetValue: 6.5,
      unit: '分',
      weight: 35,
    },
    {
      title: '完成 30 个英语演讲视频跟读',
      description: 'TED Talks 影子跟读练习',
      targetValue: 30,
      unit: '个',
      weight: 25,
    },
  ];

  const mockGenerateGoalResponse: GenerateGoalResponse = {
    goal: mockGoalDraft,
    tokenUsage: {
      promptTokens: 150,
      completionTokens: 300,
      totalTokens: 450,
    },
    generatedAt: Date.now(),
    providerUsed: '青牛云 AI',
    modelUsed: 'qingniu-4o',
  };

  const mockGenerateGoalWithKRsResponse: GenerateGoalWithKRsResponse = {
    goal: mockGoalDraft,
    keyResults: mockKeyResults,
    tokenUsage: {
      promptTokens: 200,
      completionTokens: 500,
      totalTokens: 700,
    },
    generatedAt: Date.now(),
    providerUsed: '青牛云 AI',
    modelUsed: 'qingniu-4o',
  };

  beforeEach(() => {
    // 重置单例以获取干净的实例
    // @ts-expect-error 访问私有静态属性用于测试
    GoalGenerationApplicationService.instance = undefined;
    service = GoalGenerationApplicationService.getInstance();

    // 重置所有 mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = GoalGenerationApplicationService.getInstance();
      const instance2 = GoalGenerationApplicationService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('generateGoal', () => {
    it('should generate goal successfully with minimal input', async () => {
      (goalGenerationApiClient.generateGoal as Mock).mockResolvedValue(mockGenerateGoalResponse);

      const result = await service.generateGoal('我想在三个月内提高英语口语能力');

      expect(result).toEqual(mockGenerateGoalResponse);
      expect(goalGenerationApiClient.generateGoal).toHaveBeenCalledTimes(1);
      expect(goalGenerationApiClient.generateGoal).toHaveBeenCalledWith({
        idea: '我想在三个月内提高英语口语能力',
        category: undefined,
        timeframe: undefined,
        context: undefined,
        providerUuid: undefined,
        includeKeyResults: false,
      });
    });

    it('should generate goal with all options', async () => {
      (goalGenerationApiClient.generateGoal as Mock).mockResolvedValue(mockGenerateGoalResponse);

      const options = {
        category: GoalCategory.LEARNING,
        timeframe: {
          startDate: Date.now(),
          endDate: Date.now() + 90 * 24 * 60 * 60 * 1000,
        },
        context: '我是一名软件工程师，需要与国际团队合作',
        providerUuid: 'provider-123',
      };

      const result = await service.generateGoal('我想提高英语口语能力', options);

      expect(result).toEqual(mockGenerateGoalResponse);
      expect(goalGenerationApiClient.generateGoal).toHaveBeenCalledWith({
        idea: '我想提高英语口语能力',
        ...options,
        includeKeyResults: false,
      });
    });

    it('should cache generated goal', async () => {
      (goalGenerationApiClient.generateGoal as Mock).mockResolvedValue(mockGenerateGoalResponse);

      await service.generateGoal('测试目标生成');

      expect(service.lastGeneratedGoal).toEqual(mockGoalDraft);
      expect(service.lastGeneratedKeyResults).toEqual([]);
    });

    it('should trim idea before sending', async () => {
      (goalGenerationApiClient.generateGoal as Mock).mockResolvedValue(mockGenerateGoalResponse);

      await service.generateGoal('  我想提高英语口语能力  ');

      expect(goalGenerationApiClient.generateGoal).toHaveBeenCalledWith(
        expect.objectContaining({
          idea: '我想提高英语口语能力',
        }),
      );
    });

    it('should update isGenerating state during generation', async () => {
      let resolvePromise: (value: GenerateGoalResponse) => void;
      const pendingPromise = new Promise<GenerateGoalResponse>((resolve) => {
        resolvePromise = resolve;
      });
      (goalGenerationApiClient.generateGoal as Mock).mockReturnValue(pendingPromise);

      expect(service.isGenerating).toBe(false);

      const generatePromise = service.generateGoal('测试目标生成任务');

      // 注意：由于验证是同步的，只有在验证通过后 isGenerating 才会变成 true
      // 使用 await 等待一个微任务周期
      await Promise.resolve();
      expect(service.isGenerating).toBe(true);

      resolvePromise!(mockGenerateGoalResponse);
      await generatePromise;

      expect(service.isGenerating).toBe(false);
    });

    // === 输入验证测试 ===

    it('should throw error for empty idea', async () => {
      await expect(service.generateGoal('')).rejects.toThrow('请输入您的目标想法');
      expect(goalGenerationApiClient.generateGoal).not.toHaveBeenCalled();
    });

    it('should throw error for null/undefined idea', async () => {
      await expect(service.generateGoal(null as unknown as string)).rejects.toThrow(
        '请输入您的目标想法',
      );
      await expect(service.generateGoal(undefined as unknown as string)).rejects.toThrow(
        '请输入您的目标想法',
      );
    });

    it('should throw error for idea shorter than 5 characters', async () => {
      await expect(service.generateGoal('目标')).rejects.toThrow('目标描述至少需要 5 个字符');
      expect(goalGenerationApiClient.generateGoal).not.toHaveBeenCalled();
    });

    it('should throw error for idea longer than 2000 characters', async () => {
      const longIdea = 'a'.repeat(2001);
      await expect(service.generateGoal(longIdea)).rejects.toThrow('目标描述不能超过 2000 个字符');
      expect(goalGenerationApiClient.generateGoal).not.toHaveBeenCalled();
    });

    // === 错误处理测试 ===

    it('should handle quota error', async () => {
      (goalGenerationApiClient.generateGoal as Mock).mockRejectedValue(
        new Error('quota limit exceeded'),
      );

      await expect(service.generateGoal('测试配额用尽错误')).rejects.toThrow(
        'AI 配额已用尽，请升级或等待配额重置',
      );
      expect(service.lastError).not.toBeNull();
    });

    it('should handle JSON parse error', async () => {
      (goalGenerationApiClient.generateGoal as Mock).mockRejectedValue(
        new Error('JSON parse failed'),
      );

      await expect(service.generateGoal('测试JSON解析错误')).rejects.toThrow('AI 响应解析失败，请重试');
    });

    it('should handle network error', async () => {
      (goalGenerationApiClient.generateGoal as Mock).mockRejectedValue(new Error('Network Error'));

      await expect(service.generateGoal('测试网络连接错误')).rejects.toThrow(
        '网络连接失败，请检查网络后重试',
      );
    });

    it('should handle timeout error', async () => {
      (goalGenerationApiClient.generateGoal as Mock).mockRejectedValue(new Error('Request timeout'));

      await expect(service.generateGoal('测试超时重试错误')).rejects.toThrow('AI 生成超时，请稍后重试');
    });

    it('should handle generic error', async () => {
      (goalGenerationApiClient.generateGoal as Mock).mockRejectedValue(
        new Error('Something went wrong'),
      );

      await expect(service.generateGoal('测试通用错误处理')).rejects.toThrow('Something went wrong');
    });

    it('should reset isGenerating on error', async () => {
      (goalGenerationApiClient.generateGoal as Mock).mockRejectedValue(new Error('Test error'));

      try {
        await service.generateGoal('测试生成状态重置');
      } catch {
        // Expected error
      }

      expect(service.isGenerating).toBe(false);
    });
  });

  describe('generateGoalWithKRs', () => {
    it('should generate goal with key results successfully', async () => {
      (goalGenerationApiClient.generateGoalWithKRs as Mock).mockResolvedValue(
        mockGenerateGoalWithKRsResponse,
      );

      const result = await service.generateGoalWithKRs('我想在三个月内提高英语口语能力');

      expect(result).toEqual(mockGenerateGoalWithKRsResponse);
      expect(result.keyResults).toHaveLength(3);
      expect(goalGenerationApiClient.generateGoalWithKRs).toHaveBeenCalledTimes(1);
    });

    it('should generate goal with custom key result count', async () => {
      (goalGenerationApiClient.generateGoalWithKRs as Mock).mockResolvedValue(
        mockGenerateGoalWithKRsResponse,
      );

      await service.generateGoalWithKRs('测试目标带KR生成', { keyResultCount: 4 });

      expect(goalGenerationApiClient.generateGoalWithKRs).toHaveBeenCalledWith(
        expect.objectContaining({
          keyResultCount: 4,
        }),
      );
    });

    it('should cache generated goal and key results', async () => {
      (goalGenerationApiClient.generateGoalWithKRs as Mock).mockResolvedValue(
        mockGenerateGoalWithKRsResponse,
      );

      await service.generateGoalWithKRs('测试目标缓存功能');

      expect(service.lastGeneratedGoal).toEqual(mockGoalDraft);
      expect(service.lastGeneratedKeyResults).toEqual(mockKeyResults);
    });

    it('should throw error for invalid key result count (too low)', async () => {
      await expect(service.generateGoalWithKRs('测试KR数量下限', { keyResultCount: 2 })).rejects.toThrow(
        '关键结果数量必须在 3-5 之间',
      );
      expect(goalGenerationApiClient.generateGoalWithKRs).not.toHaveBeenCalled();
    });

    it('should throw error for invalid key result count (too high)', async () => {
      await expect(service.generateGoalWithKRs('测试KR数量上限', { keyResultCount: 6 })).rejects.toThrow(
        '关键结果数量必须在 3-5 之间',
      );
      expect(goalGenerationApiClient.generateGoalWithKRs).not.toHaveBeenCalled();
    });

    it('should accept valid key result counts', async () => {
      (goalGenerationApiClient.generateGoalWithKRs as Mock).mockResolvedValue(
        mockGenerateGoalWithKRsResponse,
      );

      // 测试边界值
      await service.generateGoalWithKRs('测试KR边界值3', { keyResultCount: 3 });
      await service.generateGoalWithKRs('测试KR边界值5', { keyResultCount: 5 });

      expect(goalGenerationApiClient.generateGoalWithKRs).toHaveBeenCalledTimes(2);
    });

    it('should pass all options to API client', async () => {
      (goalGenerationApiClient.generateGoalWithKRs as Mock).mockResolvedValue(
        mockGenerateGoalWithKRsResponse,
      );

      const options = {
        category: GoalCategory.HEALTH,
        timeframe: { startDate: Date.now(), endDate: Date.now() + 30 * 24 * 60 * 60 * 1000 },
        context: '我是健身爱好者',
        providerUuid: 'qingniu-provider-001',
        keyResultCount: 4,
      };

      await service.generateGoalWithKRs('减重 10 公斤', options);

      expect(goalGenerationApiClient.generateGoalWithKRs).toHaveBeenCalledWith({
        idea: '减重 10 公斤',
        ...options,
      });
    });
  });

  describe('clearLastGenerated', () => {
    it('should clear cached goal and key results', async () => {
      (goalGenerationApiClient.generateGoalWithKRs as Mock).mockResolvedValue(
        mockGenerateGoalWithKRsResponse,
      );

      await service.generateGoalWithKRs('测试清除缓存功能');
      expect(service.lastGeneratedGoal).not.toBeNull();
      expect(service.lastGeneratedKeyResults).toHaveLength(3);

      service.clearLastGenerated();

      expect(service.lastGeneratedGoal).toBeNull();
      expect(service.lastGeneratedKeyResults).toEqual([]);
      expect(service.lastError).toBeNull();
    });

    it('should clear error state', async () => {
      (goalGenerationApiClient.generateGoal as Mock).mockRejectedValue(new Error('Test error'));

      try {
        await service.generateGoal('测试清除错误状态');
      } catch {
        // Expected error
      }

      expect(service.lastError).not.toBeNull();

      service.clearLastGenerated();

      expect(service.lastError).toBeNull();
    });
  });

  describe('state getters', () => {
    it('should return correct initial state', () => {
      expect(service.isGenerating).toBe(false);
      expect(service.lastError).toBeNull();
      expect(service.lastGeneratedGoal).toBeNull();
      expect(service.lastGeneratedKeyResults).toEqual([]);
    });
  });

  describe('initialize', () => {
    it('should initialize without error', async () => {
      await expect(service.initialize()).resolves.not.toThrow();
    });
  });
});
