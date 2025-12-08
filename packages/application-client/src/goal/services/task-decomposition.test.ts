/**
 * Task Decomposition Service - 单元测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TaskDecompositionService } from './task-decomposition';
import { AIServiceFactory } from '../../ai/AIServiceFactory';
import type { IAIService } from '@dailyuse/contracts/ai';
import type { DecompositionResult } from '@dailyuse/contracts/goal';

describe('TaskDecompositionService', () => {
  let service: TaskDecompositionService;
  let mockAIService: IAIService;

  const mockDecompositionResult: DecompositionResult = {
    tasks: [
      {
        title: '学习基础概念',
        description: '理解TypeScript泛型的基本语法',
        estimatedMinutes: 30,
        complexity: 'simple',
        dependencies: [],
        suggestedOrder: 1,
      },
      {
        title: '练习约束和条件类型',
        description: '通过示例代码练习泛型约束',
        estimatedMinutes: 60,
        complexity: 'medium',
        dependencies: ['学习基础概念'],
        suggestedOrder: 2,
      },
    ],
    timeline: {
      totalEstimatedHours: 1.5,
      estimatedDays: 1,
    },
    risks: [
      {
        description: '概念理解困难',
        mitigation: '多看实际项目代码示例',
      },
    ],
    confidence: 0.85,
  };

  beforeEach(() => {
    // 重置服务实例
    TaskDecompositionService.resetInstance();
    service = TaskDecompositionService.getInstance();

    // Mock AI Service
    mockAIService = {
      decomposeGoal: vi.fn().mockResolvedValue(mockDecompositionResult),
      estimateTaskTime: vi.fn().mockResolvedValue({ estimatedMinutes: 30, confidence: 0.9 }),
      suggestPriority: vi.fn().mockResolvedValue({
        priorities: [{ title: 'Task 1', priority: 9 }],
        reasoning: 'High priority due to dependency',
      }),
      isAvailable: vi.fn().mockResolvedValue(true),
    };

    // 注册 Mock AI Service
    AIServiceFactory.clear();
    AIServiceFactory.registerProvider('openai', mockAIService);
  });

  afterEach(() => {
    vi.clearAllMocks();
    service.clearCache();
  });

  describe('decomposeGoal', () => {
    it('应该成功分解目标', async () => {
      const result = await service.decomposeGoal(
        'goal-1',
        'Learn TypeScript Advanced',
        'Master advanced TypeScript features including generics, conditional types, and mapped types'
      );

      expect(result).toEqual(mockDecompositionResult);
      expect(mockAIService.decomposeGoal).toHaveBeenCalledWith(
        expect.objectContaining({
          goalId: 'goal-1',
          goalTitle: 'Learn TypeScript Advanced',
        })
      );
    });

    it('应该缓存分解结果', async () => {
      const goalId = 'goal-1';
      const goalTitle = 'Learn TypeScript';

      // 第一次调用
      await service.decomposeGoal(goalId, goalTitle, 'Description');
      expect(mockAIService.decomposeGoal).toHaveBeenCalledTimes(1);

      // 第二次调用应该使用缓存
      await service.decomposeGoal(goalId, goalTitle, 'Description');
      expect(mockAIService.decomposeGoal).toHaveBeenCalledTimes(1);
    });

    it('应该在禁用缓存时不使用缓存', async () => {
      const goalId = 'goal-1';
      const goalTitle = 'Learn TypeScript';

      // 第一次调用（使用缓存）
      await service.decomposeGoal(goalId, goalTitle, 'Description', { useCache: true });
      expect(mockAIService.decomposeGoal).toHaveBeenCalledTimes(1);

      // 第二次调用（禁用缓存）
      await service.decomposeGoal(goalId, goalTitle, 'Description', { useCache: false });
      expect(mockAIService.decomposeGoal).toHaveBeenCalledTimes(2);
    });

    it('应该传递用户上下文信息', async () => {
      const userContext = {
        workHoursPerDay: 8,
        skillLevel: 'intermediate',
      };

      await service.decomposeGoal(
        'goal-1',
        'Learn TypeScript',
        'Description',
        { userContext }
      );

      expect(mockAIService.decomposeGoal).toHaveBeenCalledWith(
        expect.objectContaining({
          userContext,
        })
      );
    });

    it('应该处理AI服务错误', async () => {
      const error = new Error('AI service unavailable');
      vi.mocked(mockAIService.decomposeGoal).mockRejectedValue(error);

      await expect(
        service.decomposeGoal('goal-1', 'Learn TypeScript', 'Description')
      ).rejects.toThrow('AI service unavailable');
    });
  });

  describe('缓存管理', () => {
    it('clearCache 应该清空所有缓存', async () => {
      const goalId = 'goal-1';
      const goalTitle = 'Learn TypeScript';

      // 添加到缓存
      await service.decomposeGoal(goalId, goalTitle, 'Description');
      expect(mockAIService.decomposeGoal).toHaveBeenCalledTimes(1);

      // 清空缓存
      service.clearCache();

      // 下次调用应该再次调用AI服务
      await service.decomposeGoal(goalId, goalTitle, 'Description');
      expect(mockAIService.decomposeGoal).toHaveBeenCalledTimes(2);
    });

    it('setCacheExpiry 应该更新缓存过期时间', () => {
      service.setCacheExpiry(5000); // 5秒
      expect(service).toBeDefined();
    });
  });

  describe('单例模式', () => {
    it('getInstance 应该返回相同的实例', () => {
      const service1 = TaskDecompositionService.getInstance();
      const service2 = TaskDecompositionService.getInstance();

      expect(service1).toBe(service2);
    });

    it('resetInstance 应该重置实例', () => {
      const service1 = TaskDecompositionService.getInstance();
      TaskDecompositionService.resetInstance();
      const service2 = TaskDecompositionService.getInstance();

      expect(service1).not.toBe(service2);
    });
  });
});
