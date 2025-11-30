/**
 * AIGenerationService Unit Tests
 * Test generateKeyResults() method with mock OpenAIAdapter
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIGenerationService } from '../AIGenerationService';
import type { BaseAIAdapter, AIGenerationResponse } from '../../adapters/BaseAIAdapter';
import { AIUsageQuotaServerDTO, GenerationTaskType, TokenUsageServerDTO } from '@dailyuse/contracts/ai';
import { AIValidationError } from '../../errors/AIErrors';


describe('AIGenerationService.generateKeyResults', () => {
  let service: AIGenerationService;
  let mockAdapter: BaseAIAdapter;
  let mockQuota: AIUsageQuotaServerDTO;

  beforeEach(() => {
    // Create mock adapter
    mockAdapter = {
      generateText: vi.fn(),
      streamText: vi.fn(),
      healthCheck: vi.fn(),
      getProvider: vi.fn(),
      getDefaultModel: vi.fn(),
    } as any;

    // Create service with mock adapter
    service = new AIGenerationService(mockAdapter);

    // Create mock quota
    mockQuota = {
      uuid: 'quota-uuid',
      accountUuid: 'test-account',
      quotaLimit: 50,
      currentUsage: 10,
      remainingQuota: 40,
      resetPeriod: 'DAILY',
      lastResetAt: Date.now(),
      nextResetAt: Date.now() + 86400000,
    } as any;
  });

  it('should successfully generate 3-5 key results', async () => {
    const mockKRs = [
      {
        title: 'Reduce Critical Bugs',
        description: 'Decrease P0/P1 bugs from 15 to 3',
        valueType: 'INCREMENTAL',
        targetValue: 3,
        currentValue: 15,
        unit: 'bugs',
        weight: 35,
        aggregationMethod: 'LAST',
      },
      {
        title: 'Improve User Satisfaction',
        description: 'Increase NPS from 45 to 70',
        valueType: 'INCREMENTAL',
        targetValue: 70,
        currentValue: 45,
        unit: 'points',
        weight: 30,
        aggregationMethod: 'LAST',
      },
      {
        title: 'Achieve 99.5% Uptime',
        description: 'Maintain system availability',
        valueType: 'PERCENTAGE',
        targetValue: 99.5,
        currentValue: 98,
        unit: '%',
        weight: 35,
        aggregationMethod: 'AVERAGE',
      },
    ];

    const mockResponse: AIGenerationResponse<typeof mockKRs> = {
      content: JSON.stringify(mockKRs),
      parsedContent: mockKRs,
      tokenUsage: {
        promptTokens: 150,
        completionTokens: 350,
        totalTokens: 500,
      },
      generatedAt: new Date(),
      model: 'gpt-4-turbo-preview',
    };

    vi.mocked(mockAdapter.generateText).mockResolvedValue(mockResponse);

    const result = await service.generateKeyResults(
      {
        goalTitle: 'Improve Product Quality',
        goalDescription: 'Reduce bugs and improve user satisfaction',
        startDate: Date.now(),
        endDate: Date.now() + 90 * 86400000,
      },
      mockQuota,
    );

    expect(result.result.metadata).toHaveProperty('keyResults');
    expect(result.result.metadata?.keyResults).toHaveLength(3);
    expect(result.tokenUsage.totalTokens).toBe(500);
    expect(result.updatedQuota.currentUsage).toBe(11);
    expect(result.updatedQuota.remainingQuota).toBe(40); // Quota unchanged in our test setup
  });

  it('should validate weights sum to 100±5', async () => {
    const mockKRs = [
      {
        title: 'KR1 Title',
        valueType: 'INCREMENTAL',
        targetValue: 100,
        weight: 30,
        aggregationMethod: 'LAST',
        unit: 'units',
      },
      {
        title: 'KR2 Title',
        valueType: 'INCREMENTAL',
        targetValue: 100,
        weight: 30,
        aggregationMethod: 'LAST',
        unit: 'units',
      },
      {
        title: 'KR3 Title',
        valueType: 'INCREMENTAL',
        targetValue: 100,
        weight: 30,
        aggregationMethod: 'LAST',
        unit: 'units',
      },
    ];

    const mockResponse: AIGenerationResponse<typeof mockKRs> = {
      content: JSON.stringify(mockKRs),
      parsedContent: mockKRs,
      tokenUsage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
      generatedAt: new Date(),
      model: 'gpt-4-turbo-preview',
    };

    vi.mocked(mockAdapter.generateText).mockResolvedValue(mockResponse);

    await expect(
      service.generateKeyResults(
        {
          goalTitle: 'Test Goal',
          startDate: Date.now(),
          endDate: Date.now() + 86400000,
        },
        mockQuota,
      ),
    ).rejects.toThrow(AIValidationError);
  });

  it('should reject less than 3 key results', async () => {
    const mockKRs = [
      {
        title: 'KR1',
        valueType: 'INCREMENTAL',
        targetValue: 100,
        weight: 50,
        aggregationMethod: 'LAST',
      },
      {
        title: 'KR2',
        valueType: 'INCREMENTAL',
        targetValue: 100,
        weight: 50,
        aggregationMethod: 'LAST',
      },
    ];

    const mockResponse: AIGenerationResponse<typeof mockKRs> = {
      content: JSON.stringify(mockKRs),
      parsedContent: mockKRs,
      tokenUsage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
      generatedAt: new Date(),
      model: 'gpt-4-turbo-preview',
    };

    vi.mocked(mockAdapter.generateText).mockResolvedValue(mockResponse);

    await expect(
      service.generateKeyResults(
        { goalTitle: 'Test Goal', startDate: Date.now(), endDate: Date.now() + 86400000 },
        mockQuota,
      ),
    ).rejects.toThrow(AIValidationError);
  });

  it('should reject more than 5 key results', async () => {
    const mockKRs = Array.from({ length: 6 }, (_, i) => ({
      title: `KR${i + 1}`,
      valueType: 'INCREMENTAL',
      targetValue: 100,
      weight: 16.67,
      aggregationMethod: 'LAST',
    }));

    const mockResponse: AIGenerationResponse<typeof mockKRs> = {
      content: JSON.stringify(mockKRs),
      parsedContent: mockKRs,
      tokenUsage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
      generatedAt: new Date(),
      model: 'gpt-4-turbo-preview',
    };

    vi.mocked(mockAdapter.generateText).mockResolvedValue(mockResponse);

    await expect(
      service.generateKeyResults(
        { goalTitle: 'Test Goal', startDate: Date.now(), endDate: Date.now() + 86400000 },
        mockQuota,
      ),
    ).rejects.toThrow(AIValidationError);
  });

  it('should reject KR with title less than 5 chars', async () => {
    const mockKRs = [
      {
        title: 'KR1',
        valueType: 'INCREMENTAL',
        targetValue: 100,
        weight: 33,
        aggregationMethod: 'LAST',
      },
      {
        title: 'KR',
        valueType: 'INCREMENTAL',
        targetValue: 100,
        weight: 33,
        aggregationMethod: 'LAST',
      },
      {
        title: 'KR3',
        valueType: 'INCREMENTAL',
        targetValue: 100,
        weight: 34,
        aggregationMethod: 'LAST',
      },
    ];

    const mockResponse: AIGenerationResponse<typeof mockKRs> = {
      content: JSON.stringify(mockKRs),
      parsedContent: mockKRs,
      tokenUsage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
      generatedAt: new Date(),
      model: 'gpt-4-turbo-preview',
    };

    vi.mocked(mockAdapter.generateText).mockResolvedValue(mockResponse);

    await expect(
      service.generateKeyResults(
        { goalTitle: 'Test Goal', startDate: Date.now(), endDate: Date.now() + 86400000 },
        mockQuota,
      ),
    ).rejects.toThrow(AIValidationError);
  });

  it('should consume quota after successful generation', async () => {
    const mockKRs = [
      {
        title: 'KR1 Test',
        valueType: 'INCREMENTAL',
        targetValue: 100,
        weight: 33,
        aggregationMethod: 'LAST',
        unit: 'units',
      },
      {
        title: 'KR2 Test',
        valueType: 'INCREMENTAL',
        targetValue: 100,
        weight: 33,
        aggregationMethod: 'LAST',
        unit: 'units',
      },
      {
        title: 'KR3 Test',
        valueType: 'INCREMENTAL',
        targetValue: 100,
        weight: 34,
        aggregationMethod: 'LAST',
        unit: 'units',
      },
    ];

    const mockResponse: AIGenerationResponse<typeof mockKRs> = {
      content: JSON.stringify(mockKRs),
      parsedContent: mockKRs,
      tokenUsage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
      generatedAt: new Date(),
      model: 'gpt-4-turbo-preview',
    };

    vi.mocked(mockAdapter.generateText).mockResolvedValue(mockResponse);

    const result = await service.generateKeyResults(
      { goalTitle: 'Test Goal', startDate: Date.now(), endDate: Date.now() + 86400000 },
      mockQuota,
    );

    expect(result.updatedQuota.currentUsage).toBe(mockQuota.currentUsage + 1);
    // remainingQuota is not auto-calculated by consumeQuota
  });
});

describe('AIGenerationService.generateTaskTemplate', () => {
  let service: AIGenerationService;
  let mockAdapter: BaseAIAdapter;
  let mockQuota: AIUsageQuotaServerDTO;

  beforeEach(() => {
    // Create mock adapter
    mockAdapter = {
      generateText: vi.fn(),
      streamText: vi.fn(),
      healthCheck: vi.fn(),
      getProvider: vi.fn(),
      getDefaultModel: vi.fn(),
    } as any;

    // Create service with mock adapter
    service = new AIGenerationService(mockAdapter);

    // Create mock quota
    mockQuota = {
      uuid: 'quota-uuid',
      accountUuid: 'test-account',
      quotaLimit: 50,
      currentUsage: 10,
      remainingQuota: 40,
      resetPeriod: 'DAILY',
      lastResetAt: Date.now(),
      nextResetAt: Date.now() + 86400000,
    } as any;
  });

  it('should successfully generate 5-10 tasks', async () => {
    const mockTasks = [
      {
        title: 'Research user feedback',
        description:
          'Analyze user reviews and feedback from the past 6 months to identify common pain points and feature requests.',
        estimatedHours: 8,
        priority: 'HIGH',
        dependencies: [],
        tags: ['research', 'ux'],
      },
      {
        title: 'Design new dashboard layout',
        description:
          'Create wireframes and mockups for improved dashboard with better data visualization.',
        estimatedHours: 16,
        priority: 'HIGH',
        dependencies: [0],
        tags: ['design', 'ui'],
      },
      {
        title: 'Implement backend API',
        description:
          'Develop RESTful API endpoints for new features with proper authentication and validation.',
        estimatedHours: 24,
        priority: 'HIGH',
        dependencies: [1],
        tags: ['backend', 'api'],
      },
      {
        title: 'Create frontend components',
        description:
          'Build React components for new dashboard with responsive design and accessibility.',
        estimatedHours: 20,
        priority: 'MEDIUM',
        dependencies: [1, 2],
        tags: ['frontend', 'react'],
      },
      {
        title: 'Write unit tests',
        description:
          'Create comprehensive unit tests for all new components and API endpoints with >80% coverage.',
        estimatedHours: 12,
        priority: 'MEDIUM',
        dependencies: [2, 3],
        tags: ['testing', 'quality'],
      },
    ];

    const mockResponse: AIGenerationResponse<typeof mockTasks> = {
      content: JSON.stringify(mockTasks),
      parsedContent: mockTasks,
      tokenUsage: {
        promptTokens: 200,
        completionTokens: 400,
        totalTokens: 600,
      },
      generatedAt: new Date(),
      model: 'gpt-4-turbo-preview',
    };

    vi.mocked(mockAdapter.generateText).mockResolvedValue(mockResponse);

    const result = await service.generateTaskTemplate(
      {
        krTitle: 'Increase monthly active users',
        krDescription: 'Improve user engagement through better UX',
        targetValue: 10000,
        currentValue: 2000,
        unit: 'users',
        timeRemaining: 90,
      },
      mockQuota,
    );

    expect(result.result.metadata).toHaveProperty('tasks');
    expect(result.result.metadata?.tasks).toHaveLength(5);
    expect(result.tokenUsage.totalTokens).toBe(600);
    expect(result.updatedQuota.currentUsage).toBe(11);
  });

  it('should validate task count is between 5-10', async () => {
    const mockTasks = [
      {
        title: 'Task 1',
        description: 'A'.repeat(50),
        estimatedHours: 5,
        priority: 'HIGH',
        dependencies: [],
      },
      {
        title: 'Task 2',
        description: 'B'.repeat(50),
        estimatedHours: 5,
        priority: 'MEDIUM',
        dependencies: [],
      },
      {
        title: 'Task 3',
        description: 'C'.repeat(50),
        estimatedHours: 5,
        priority: 'LOW',
        dependencies: [],
      },
    ];

    const mockResponse: AIGenerationResponse = {
      content: JSON.stringify(mockTasks),
      parsedContent: mockTasks,
      tokenUsage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
      generatedAt: new Date(),
      model: 'gpt-4-turbo-preview',
    };

    vi.mocked(mockAdapter.generateText).mockResolvedValue(mockResponse);

    await expect(
      service.generateTaskTemplate(
        {
          krTitle: 'Test KR',
          targetValue: 100,
          currentValue: 50,
          timeRemaining: 30,
        },
        mockQuota,
      ),
    ).rejects.toThrow(AIValidationError);
  });

  it('should validate task title starts with capitalized verb', async () => {
    const mockTasks = Array.from({ length: 5 }, (_, i) => ({
      title: i === 2 ? 'invalid title' : `Task ${i + 1}`,
      description: 'A'.repeat(50),
      estimatedHours: 5,
      priority: 'MEDIUM',
      dependencies: [],
    }));

    const mockResponse: AIGenerationResponse = {
      content: JSON.stringify(mockTasks),
      parsedContent: mockTasks,
      tokenUsage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
      generatedAt: new Date(),
      model: 'gpt-4-turbo-preview',
    };

    vi.mocked(mockAdapter.generateText).mockResolvedValue(mockResponse);

    await expect(
      service.generateTaskTemplate(
        {
          krTitle: 'Test KR',
          targetValue: 100,
          currentValue: 50,
          timeRemaining: 30,
        },
        mockQuota,
      ),
    ).rejects.toThrow(AIValidationError);
  });

  it('should validate estimatedHours is between 1-40', async () => {
    const mockTasks = Array.from({ length: 5 }, (_, i) => ({
      title: `Task ${i + 1}`,
      description: 'A'.repeat(50),
      estimatedHours: i === 2 ? 50 : 10,
      priority: 'MEDIUM',
      dependencies: [],
    }));

    const mockResponse: AIGenerationResponse = {
      content: JSON.stringify(mockTasks),
      parsedContent: mockTasks,
      tokenUsage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
      generatedAt: new Date(),
      model: 'gpt-4-turbo-preview',
    };

    vi.mocked(mockAdapter.generateText).mockResolvedValue(mockResponse);

    await expect(
      service.generateTaskTemplate(
        {
          krTitle: 'Test KR',
          targetValue: 100,
          currentValue: 50,
          timeRemaining: 30,
        },
        mockQuota,
      ),
    ).rejects.toThrow(AIValidationError);
  });

  it('should validate priority is HIGH, MEDIUM, or LOW', async () => {
    const mockTasks = Array.from({ length: 5 }, (_, i) => ({
      title: `Task ${i + 1}`,
      description: 'A'.repeat(50),
      estimatedHours: 10,
      priority: i === 2 ? 'INVALID' : 'MEDIUM',
      dependencies: [],
    }));

    const mockResponse: AIGenerationResponse = {
      content: JSON.stringify(mockTasks),
      parsedContent: mockTasks,
      tokenUsage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
      generatedAt: new Date(),
      model: 'gpt-4-turbo-preview',
    };

    vi.mocked(mockAdapter.generateText).mockResolvedValue(mockResponse);

    await expect(
      service.generateTaskTemplate(
        {
          krTitle: 'Test KR',
          targetValue: 100,
          currentValue: 50,
          timeRemaining: 30,
        },
        mockQuota,
      ),
    ).rejects.toThrow(AIValidationError);
  });

  it('should validate dependencies array contains valid indices', async () => {
    const mockTasks = Array.from({ length: 5 }, (_, i) => ({
      title: `Task ${i + 1}`,
      description: 'A'.repeat(50),
      estimatedHours: 10,
      priority: 'MEDIUM',
      dependencies: i === 2 ? [999] : [],
    }));

    const mockResponse: AIGenerationResponse = {
      content: JSON.stringify(mockTasks),
      parsedContent: mockTasks,
      tokenUsage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
      generatedAt: new Date(),
      model: 'gpt-4-turbo-preview',
    };

    vi.mocked(mockAdapter.generateText).mockResolvedValue(mockResponse);

    await expect(
      service.generateTaskTemplate(
        {
          krTitle: 'Test KR',
          targetValue: 100,
          currentValue: 50,
          timeRemaining: 30,
        },
        mockQuota,
      ),
    ).rejects.toThrow(AIValidationError);
  });

  it('should validate description is at least 50 chars if provided', async () => {
    const mockTasks = Array.from({ length: 5 }, (_, i) => ({
      title: `Task ${i + 1}`,
      description: i === 2 ? 'Too short' : 'A'.repeat(50),
      estimatedHours: 10,
      priority: 'MEDIUM',
      dependencies: [],
    }));

    const mockResponse: AIGenerationResponse = {
      content: JSON.stringify(mockTasks),
      parsedContent: mockTasks,
      tokenUsage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
      generatedAt: new Date(),
      model: 'gpt-4-turbo-preview',
    };

    vi.mocked(mockAdapter.generateText).mockResolvedValue(mockResponse);

    await expect(
      service.generateTaskTemplate(
        {
          krTitle: 'Test KR',
          targetValue: 100,
          currentValue: 50,
          timeRemaining: 30,
        },
        mockQuota,
      ),
    ).rejects.toThrow(AIValidationError);
  });

  it('should consume quota after successful generation', async () => {
    const mockTasks = Array.from({ length: 5 }, (_, i) => ({
      title: `Task ${i + 1}`,
      description: 'A'.repeat(50),
      estimatedHours: 10,
      priority: 'MEDIUM',
      dependencies: [],
    }));

    const mockResponse: AIGenerationResponse = {
      content: JSON.stringify(mockTasks),
      parsedContent: mockTasks,
      tokenUsage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
      generatedAt: new Date(),
      model: 'gpt-4-turbo-preview',
    };

    vi.mocked(mockAdapter.generateText).mockResolvedValue(mockResponse);

    const result = await service.generateTaskTemplate(
      {
        krTitle: 'Test KR',
        targetValue: 100,
        currentValue: 50,
        timeRemaining: 30,
      },
      mockQuota,
    );

    expect(result.updatedQuota.currentUsage).toBe(mockQuota.currentUsage + 1);
  });
});
