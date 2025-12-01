/**
 * GoalGenerationApplicationService Unit Tests
 * 目标生成应用服务单元测试
 *
 * 测试范围：
 * - generateGoal() - 从用户想法生成目标
 * - generateKeyResults() - 从目标生成关键结果
 * - 输入验证
 * - 配额检查
 * - 错误处理
 * - AI Provider 配置动态获取
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { GoalGenerationApplicationService } from '../GoalGenerationApplicationService';
import type { IAIUsageQuotaRepository, IAIProviderConfigRepository, AIGenerationValidationService } from '@dailyuse/domain-server/ai';
import type { BaseAIAdapter, AIGenerationResponse } from '../../../infrastructure/adapters/BaseAIAdapter';
import type { GeneratedGoalDraft, KeyResultPreview, AIUsageQuotaServerDTO, AIProviderConfigServerDTO } from '@dailyuse/contracts/ai';
import { GoalCategory, AIProviderType } from '@dailyuse/contracts/ai';
import { AIAdapterFactory } from '../../../infrastructure/adapters/AIAdapterFactory';

// Mock AIAdapterFactory
vi.mock('../../../infrastructure/adapters/AIAdapterFactory', () => ({
  AIAdapterFactory: {
    createFromConfig: vi.fn(),
  },
}));

describe('GoalGenerationApplicationService', () => {
  let service: GoalGenerationApplicationService;
  let mockValidationService: AIGenerationValidationService;
  let mockProviderConfigRepository: IAIProviderConfigRepository;
  let mockQuotaRepository: IAIUsageQuotaRepository;
  let mockAiAdapter: BaseAIAdapter;

  // Mock 数据
  const mockAccountUuid = 'test-account-123';

  const mockProviderConfig: AIProviderConfigServerDTO = {
    uuid: 'provider-123',
    accountUuid: mockAccountUuid,
    name: '我的 AI Provider',
    providerType: AIProviderType.QINIU,
    baseUrl: 'https://openai.qiniu.com/v1',
    apiKey: 'test-api-key',
    defaultModel: 'deepseek-v3',
    availableModels: [],
    isActive: true,
    isDefault: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const mockQuota: AIUsageQuotaServerDTO = {
    uuid: 'quota-123',
    accountUuid: mockAccountUuid,
    quotaLimit: 100,
    currentUsage: 10,
    resetPeriod: 'MONTHLY' as any,
    lastResetAt: Date.now(),
    nextResetAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const mockGoalDraft: GeneratedGoalDraft = {
    title: '提升英语口语能力',
    description: '通过每日练习和实际对话场景，在三个月内显著提升英语口语流利度和自信心',
    motivation: '为了更好的职业发展和国际交流机会',
    category: GoalCategory.LEARNING,
    suggestedStartDate: Date.now(),
    suggestedEndDate: Date.now() + 90 * 24 * 60 * 60 * 1000,
    importance: 'moderate' as any,
    urgency: 'medium' as any,
    tags: ['英语', '学习', '口语'],
    feasibilityAnalysis: '通过每日 30 分钟练习，目标可行性高',
    aiInsights: '建议结合影子跟读和实际对话练习',
  };

  const mockKeyResults: KeyResultPreview[] = [
    {
      title: '完成 100 小时英语对话练习',
      description: '使用语言交换 App 进行真人对话练习',
      valueType: 'NUMBER' as any,
      targetValue: 100,
      currentValue: 0,
      unit: '小时',
      weight: 40,
      aggregationMethod: 'SUM' as any,
    },
    {
      title: '雅思口语模拟测试达到 6.5 分',
      description: '每月进行一次模拟测试',
      valueType: 'NUMBER' as any,
      targetValue: 6.5,
      currentValue: 0,
      unit: '分',
      weight: 35,
      aggregationMethod: 'LATEST' as any,
    },
    {
      title: '完成 30 个英语演讲视频跟读',
      description: 'TED Talks 影子跟读练习',
      valueType: 'NUMBER' as any,
      targetValue: 30,
      currentValue: 0,
      unit: '个',
      weight: 25,
      aggregationMethod: 'SUM' as any,
    },
  ];

  const mockAiResponse: AIGenerationResponse<GeneratedGoalDraft> = {
    content: JSON.stringify(mockGoalDraft),
    parsedContent: mockGoalDraft,
    tokenUsage: {
      promptTokens: 150,
      completionTokens: 300,
      totalTokens: 450,
    },
    generatedAt: new Date(),
  };

  const mockKeyResultsResponse: AIGenerationResponse<KeyResultPreview[]> = {
    content: JSON.stringify(mockKeyResults),
    parsedContent: mockKeyResults,
    tokenUsage: {
      promptTokens: 200,
      completionTokens: 400,
      totalTokens: 600,
    },
    generatedAt: new Date(),
  };

  beforeEach(() => {
    // Mock ValidationService
    mockValidationService = {
      validateKeyResultsOutput: vi.fn(),
      validateTasksOutput: vi.fn(),
      validateSummaryOutput: vi.fn(),
      validateKnowledgeSeriesOutput: vi.fn(),
    } as any;

    // Mock AI Adapter
    mockAiAdapter = {
      generateText: vi.fn(),
      streamText: vi.fn(),
    } as any;

    // Mock Provider Config Repository
    mockProviderConfigRepository = {
      findByUuid: vi.fn(),
      findDefaultByAccountUuid: vi.fn(),
      findByAccountUuid: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      findByAccountUuidAndName: vi.fn(),
      clearDefaultForAccount: vi.fn(),
    } as any;

    // Mock Quota Repository
    mockQuotaRepository = {
      findByAccountUuid: vi.fn(),
      save: vi.fn(),
      findByUuid: vi.fn(),
    } as any;

    // 创建服务实例（使用新的架构）
    service = new GoalGenerationApplicationService(
      mockValidationService,
      mockProviderConfigRepository,
      mockQuotaRepository,
    );

    // 默认 Mock 配置
    (mockProviderConfigRepository.findDefaultByAccountUuid as Mock).mockResolvedValue(mockProviderConfig);
    (AIAdapterFactory.createFromConfig as Mock).mockReturnValue(mockAiAdapter);

    // 重置 mocks
    vi.clearAllMocks();
  });

  describe('generateGoal', () => {
    it('should generate goal successfully with valid input', async () => {
      (mockProviderConfigRepository.findDefaultByAccountUuid as Mock).mockResolvedValue(mockProviderConfig);
      (AIAdapterFactory.createFromConfig as Mock).mockReturnValue(mockAiAdapter);
      (mockQuotaRepository.findByAccountUuid as Mock).mockResolvedValue(mockQuota);
      (mockAiAdapter.generateText as Mock).mockResolvedValue(mockAiResponse);

      const result = await service.generateGoal({
        accountUuid: mockAccountUuid,
        idea: '我想在三个月内提高英语口语能力',
      });

      expect(result.goal).toEqual(mockGoalDraft);
      expect(result.tokenUsage.totalTokens).toBe(450);
      expect(result.providerUsed).toBe('我的 AI Provider');
      expect(result.modelUsed).toBe('deepseek-v3');
      expect(mockQuotaRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should generate goal with specified provider', async () => {
      const specifiedProvider = { ...mockProviderConfig, uuid: 'specific-provider-uuid', name: '指定的 Provider' };
      (mockProviderConfigRepository.findByUuid as Mock).mockResolvedValue(specifiedProvider);
      (AIAdapterFactory.createFromConfig as Mock).mockReturnValue(mockAiAdapter);
      (mockQuotaRepository.findByAccountUuid as Mock).mockResolvedValue(mockQuota);
      (mockAiAdapter.generateText as Mock).mockResolvedValue(mockAiResponse);

      const result = await service.generateGoal({
        accountUuid: mockAccountUuid,
        idea: '我想在三个月内提高英语口语能力',
        providerUuid: 'specific-provider-uuid',
      });

      expect(result.providerUsed).toBe('指定的 Provider');
      expect(mockProviderConfigRepository.findByUuid).toHaveBeenCalledWith('specific-provider-uuid');
    });

    it('should throw error when no AI provider is configured', async () => {
      (mockProviderConfigRepository.findDefaultByAccountUuid as Mock).mockResolvedValue(null);
      (mockQuotaRepository.findByAccountUuid as Mock).mockResolvedValue(mockQuota);

      await expect(
        service.generateGoal({
          accountUuid: mockAccountUuid,
          idea: '我想提高英语口语能力',
        }),
      ).rejects.toThrow('No AI Provider configured');
    });

    it('should throw error when AI provider is not active', async () => {
      const inactiveProvider = { ...mockProviderConfig, isActive: false };
      (mockProviderConfigRepository.findDefaultByAccountUuid as Mock).mockResolvedValue(inactiveProvider);
      (mockQuotaRepository.findByAccountUuid as Mock).mockResolvedValue(mockQuota);

      await expect(
        service.generateGoal({
          accountUuid: mockAccountUuid,
          idea: '我想提高英语口语能力',
        }),
      ).rejects.toThrow('AI Provider is not active');
    });

    it('should throw error when specified provider belongs to different account', async () => {
      const otherAccountProvider = { ...mockProviderConfig, accountUuid: 'other-account' };
      (mockProviderConfigRepository.findByUuid as Mock).mockResolvedValue(otherAccountProvider);
      (mockQuotaRepository.findByAccountUuid as Mock).mockResolvedValue(mockQuota);

      await expect(
        service.generateGoal({
          accountUuid: mockAccountUuid,
          idea: '我想提高英语口语能力',
          providerUuid: 'some-provider',
        }),
      ).rejects.toThrow('AI Provider does not belong to this account');
    });

    it('should generate goal with all optional parameters', async () => {
      (mockProviderConfigRepository.findDefaultByAccountUuid as Mock).mockResolvedValue(mockProviderConfig);
      (AIAdapterFactory.createFromConfig as Mock).mockReturnValue(mockAiAdapter);
      (mockQuotaRepository.findByAccountUuid as Mock).mockResolvedValue(mockQuota);
      (mockAiAdapter.generateText as Mock).mockResolvedValue(mockAiResponse);

      const result = await service.generateGoal({
        accountUuid: mockAccountUuid,
        idea: '我想在三个月内提高英语口语能力',
        context: '我是一名软件工程师',
        category: GoalCategory.LEARNING,
        timeframe: {
          startDate: Date.now(),
          endDate: Date.now() + 90 * 24 * 60 * 60 * 1000,
        },
      });

      expect(result.goal.title).toBe('提升英语口语能力');
      expect(mockAiAdapter.generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          contextData: expect.objectContaining({
            additionalContext: '我是一名软件工程师',
          }),
        }),
      );
    });

    it('should create new quota if not exists', async () => {
      (mockProviderConfigRepository.findDefaultByAccountUuid as Mock).mockResolvedValue(mockProviderConfig);
      (AIAdapterFactory.createFromConfig as Mock).mockReturnValue(mockAiAdapter);
      (mockQuotaRepository.findByAccountUuid as Mock).mockResolvedValue(null);
      (mockAiAdapter.generateText as Mock).mockResolvedValue(mockAiResponse);

      await service.generateGoal({
        accountUuid: mockAccountUuid,
        idea: '我想提高英语口语能力',
      });

      // 应该调用两次 save：创建配额 + 消费配额
      expect(mockQuotaRepository.save).toHaveBeenCalledTimes(2);
    });

    // === 输入验证测试 ===

    it('should throw error for empty idea', async () => {
      await expect(
        service.generateGoal({
          accountUuid: mockAccountUuid,
          idea: '',
        }),
      ).rejects.toThrow('Idea is required');
    });

    it('should throw error for idea shorter than 5 characters', async () => {
      await expect(
        service.generateGoal({
          accountUuid: mockAccountUuid,
          idea: '目标',
        }),
      ).rejects.toThrow('Idea must be at least 5 characters');
    });

    it('should throw error for idea longer than 2000 characters', async () => {
      const longIdea = 'a'.repeat(2001);
      await expect(
        service.generateGoal({
          accountUuid: mockAccountUuid,
          idea: longIdea,
        }),
      ).rejects.toThrow('Idea must be less than 2000 characters');
    });

    // === 配额测试 ===

    it('should throw error when quota is exceeded', async () => {
      const exhaustedQuota = { ...mockQuota, currentUsage: 100 };
      (mockProviderConfigRepository.findDefaultByAccountUuid as Mock).mockResolvedValue(mockProviderConfig);
      (mockQuotaRepository.findByAccountUuid as Mock).mockResolvedValue(exhaustedQuota);

      await expect(
        service.generateGoal({
          accountUuid: mockAccountUuid,
          idea: '我想提高英语口语能力',
        }),
      ).rejects.toThrow();
    });

    // === AI 响应解析测试 ===

    it('should throw error when AI response cannot be parsed', async () => {
      (mockProviderConfigRepository.findDefaultByAccountUuid as Mock).mockResolvedValue(mockProviderConfig);
      (AIAdapterFactory.createFromConfig as Mock).mockReturnValue(mockAiAdapter);
      (mockQuotaRepository.findByAccountUuid as Mock).mockResolvedValue(mockQuota);
      (mockAiAdapter.generateText as Mock).mockResolvedValue({
        content: 'invalid json',
        parsedContent: null,
        tokenUsage: { promptTokens: 100, completionTokens: 100, totalTokens: 200 },
        generatedAt: new Date(),
      });

      await expect(
        service.generateGoal({
          accountUuid: mockAccountUuid,
          idea: '我想提高英语口语能力',
        }),
      ).rejects.toThrow('AI response JSON parse failed');
    });

    // === 目标草稿验证测试 ===

    it('should throw error when generated goal has invalid title', async () => {
      const invalidGoal = { ...mockGoalDraft, title: '' };
      (mockProviderConfigRepository.findDefaultByAccountUuid as Mock).mockResolvedValue(mockProviderConfig);
      (AIAdapterFactory.createFromConfig as Mock).mockReturnValue(mockAiAdapter);
      (mockQuotaRepository.findByAccountUuid as Mock).mockResolvedValue(mockQuota);
      (mockAiAdapter.generateText as Mock).mockResolvedValue({
        ...mockAiResponse,
        parsedContent: invalidGoal,
      });

      await expect(
        service.generateGoal({
          accountUuid: mockAccountUuid,
          idea: '我想提高英语口语能力',
        }),
      ).rejects.toThrow('Generated goal must have a valid title');
    });

    it('should throw error when generated goal has invalid importance', async () => {
      const invalidGoal = { ...mockGoalDraft, importance: 'invalid-level' };
      (mockProviderConfigRepository.findDefaultByAccountUuid as Mock).mockResolvedValue(mockProviderConfig);
      (AIAdapterFactory.createFromConfig as Mock).mockReturnValue(mockAiAdapter);
      (mockQuotaRepository.findByAccountUuid as Mock).mockResolvedValue(mockQuota);
      (mockAiAdapter.generateText as Mock).mockResolvedValue({
        ...mockAiResponse,
        parsedContent: invalidGoal,
      });

      await expect(
        service.generateGoal({
          accountUuid: mockAccountUuid,
          idea: '我想提高英语口语能力',
        }),
      ).rejects.toThrow('Generated goal must have valid importance');
    });
  });

  describe('generateKeyResults', () => {
    it('should generate key results successfully', async () => {
      (mockProviderConfigRepository.findDefaultByAccountUuid as Mock).mockResolvedValue(mockProviderConfig);
      (AIAdapterFactory.createFromConfig as Mock).mockReturnValue(mockAiAdapter);
      (mockQuotaRepository.findByAccountUuid as Mock).mockResolvedValue(mockQuota);
      (mockAiAdapter.generateText as Mock).mockResolvedValue(mockKeyResultsResponse);

      const result = await service.generateKeyResults({
        accountUuid: mockAccountUuid,
        goalTitle: '提升英语口语能力',
        goalDescription: '在三个月内提升口语流利度',
        startDate: Date.now(),
        endDate: Date.now() + 90 * 24 * 60 * 60 * 1000,
      });

      expect(result.keyResults).toHaveLength(3);
      expect(result.tokenUsage.totalTokens).toBe(600);
      expect(mockValidationService.validateKeyResultsOutput).toHaveBeenCalledWith(mockKeyResults);
      expect(mockQuotaRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should generate key results with goal context', async () => {
      (mockProviderConfigRepository.findDefaultByAccountUuid as Mock).mockResolvedValue(mockProviderConfig);
      (AIAdapterFactory.createFromConfig as Mock).mockReturnValue(mockAiAdapter);
      (mockQuotaRepository.findByAccountUuid as Mock).mockResolvedValue(mockQuota);
      (mockAiAdapter.generateText as Mock).mockResolvedValue(mockKeyResultsResponse);

      await service.generateKeyResults({
        accountUuid: mockAccountUuid,
        goalTitle: '提升英语口语能力',
        startDate: Date.now(),
        endDate: Date.now() + 90 * 24 * 60 * 60 * 1000,
        goalContext: '我是软件工程师，需要与国际团队合作',
      });

      expect(mockAiAdapter.generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          contextData: expect.objectContaining({
            goalContext: '我是软件工程师，需要与国际团队合作',
          }),
        }),
      );
    });

    // === 输入验证测试 ===

    it('should throw error for empty goal title', async () => {
      await expect(
        service.generateKeyResults({
          accountUuid: mockAccountUuid,
          goalTitle: '',
          startDate: Date.now(),
          endDate: Date.now() + 90 * 24 * 60 * 60 * 1000,
        }),
      ).rejects.toThrow('Goal title is required');
    });

    it('should throw error for goal title shorter than 2 characters', async () => {
      await expect(
        service.generateKeyResults({
          accountUuid: mockAccountUuid,
          goalTitle: 'A',
          startDate: Date.now(),
          endDate: Date.now() + 90 * 24 * 60 * 60 * 1000,
        }),
      ).rejects.toThrow('Goal title must be at least 2 characters');
    });

    it('should throw error for goal title longer than 200 characters', async () => {
      const longTitle = 'a'.repeat(201);
      await expect(
        service.generateKeyResults({
          accountUuid: mockAccountUuid,
          goalTitle: longTitle,
          startDate: Date.now(),
          endDate: Date.now() + 90 * 24 * 60 * 60 * 1000,
        }),
      ).rejects.toThrow('Goal title must be less than 200 characters');
    });

    // === 配额测试 ===

    it('should create new quota if not exists for key results', async () => {
      (mockQuotaRepository.findByAccountUuid as Mock).mockResolvedValue(null);
      (mockAiAdapter.generateText as Mock).mockResolvedValue(mockKeyResultsResponse);

      await service.generateKeyResults({
        accountUuid: mockAccountUuid,
        goalTitle: '提升英语口语能力',
        startDate: Date.now(),
        endDate: Date.now() + 90 * 24 * 60 * 60 * 1000,
      });

      // 应该调用两次 save：创建配额 + 消费配额
      expect(mockQuotaRepository.save).toHaveBeenCalledTimes(2);
    });

    // === AI 响应解析测试 ===

    it('should throw error when key results response cannot be parsed', async () => {
      (mockQuotaRepository.findByAccountUuid as Mock).mockResolvedValue(mockQuota);
      (mockAiAdapter.generateText as Mock).mockResolvedValue({
        content: 'invalid json',
        parsedContent: null,
        tokenUsage: { promptTokens: 100, completionTokens: 100, totalTokens: 200 },
        generatedAt: new Date(),
      });

      await expect(
        service.generateKeyResults({
          accountUuid: mockAccountUuid,
          goalTitle: '提升英语口语能力',
          startDate: Date.now(),
          endDate: Date.now() + 90 * 24 * 60 * 60 * 1000,
        }),
      ).rejects.toThrow('AI response JSON parse failed');
    });

    // === 验证服务调用测试 ===

    it('should call validation service for key results', async () => {
      (mockQuotaRepository.findByAccountUuid as Mock).mockResolvedValue(mockQuota);
      (mockAiAdapter.generateText as Mock).mockResolvedValue(mockKeyResultsResponse);

      await service.generateKeyResults({
        accountUuid: mockAccountUuid,
        goalTitle: '提升英语口语能力',
        startDate: Date.now(),
        endDate: Date.now() + 90 * 24 * 60 * 60 * 1000,
      });

      expect(mockValidationService.validateKeyResultsOutput).toHaveBeenCalledWith(mockKeyResults);
    });

    it('should propagate validation service errors', async () => {
      (mockQuotaRepository.findByAccountUuid as Mock).mockResolvedValue(mockQuota);
      (mockAiAdapter.generateText as Mock).mockResolvedValue(mockKeyResultsResponse);
      (mockValidationService.validateKeyResultsOutput as Mock).mockImplementation(() => {
        throw new Error('Invalid key results format');
      });

      await expect(
        service.generateKeyResults({
          accountUuid: mockAccountUuid,
          goalTitle: '提升英语口语能力',
          startDate: Date.now(),
          endDate: Date.now() + 90 * 24 * 60 * 60 * 1000,
        }),
      ).rejects.toThrow('Invalid key results format');
    });
  });
});
