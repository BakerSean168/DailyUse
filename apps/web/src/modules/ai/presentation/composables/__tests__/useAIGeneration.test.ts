/**
 * useAIGeneration Composable Tests
 * Story 2.4: Generate Task Templates UI
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

// Mock API clients
const mockGenerateTasks = vi.fn();
const mockGenerateKeyResults = vi.fn();

vi.mock('@/modules/ai/infrastructure/api/aiGenerationApiClient', () => ({
  aiGenerationApiClient: {
    generateTasks: mockGenerateTasks,
    generateKeyResults: mockGenerateKeyResults,
  },
}));

vi.mock('@/modules/goal/infrastructure/api/goalApiClient', () => ({
  goalApiClient: {
    generateKeyResults: vi.fn(),
  },
}));

import { useAIGeneration } from '../useAIGeneration';

describe('useAIGeneration - generateTasks', () => {
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns generateTasks method', () => {
    const { generateTasks } = useAIGeneration();
    expect(generateTasks).toBeDefined();
    expect(typeof generateTasks).toBe('function');
  });

  it('calls API client with correct parameters', async () => {
    mockGenerateTasks.mockResolvedValue({
      tasks: [
        {
          title: 'Test Task',
          description: 'Description',
          estimatedHours: 8,
          priority: 'normal',
          dependencies: [],
          tags: [],
        },
      ],
      tokenUsage: {
        promptTokens: 100,
        completionTokens: 200,
        totalTokens: 300,
      },
      generatedAt: Date.now(),
    });

    const { generateTasks } = useAIGeneration();

    const request = {
      keyResultTitle: 'Reduce bugs to 50',
      keyResultDescription: 'Focus on critical bugs',
      targetValue: 50,
      currentValue: 100,
      unit: 'bugs',
      timeRemaining: 30,
    };

    await generateTasks(request);

    expect(mockGenerateTasks).toHaveBeenCalledWith(request);
  });

  it('returns tasks array on success', async () => {
    const mockResponse = {
      tasks: [
        {
          title: 'Task 1',
          description: 'Desc 1',
          estimatedHours: 8,
          priority: 'high',
          dependencies: [],
          tags: ['tag1'],
        },
        {
          title: 'Task 2',
          description: 'Desc 2',
          estimatedHours: 12,
          priority: 'normal',
          dependencies: [0],
          tags: ['tag2'],
        },
      ],
      tokenUsage: {
        promptTokens: 150,
        completionTokens: 250,
        totalTokens: 400,
      },
      generatedAt: Date.now(),
    };

    mockGenerateTasks.mockResolvedValue(mockResponse);

    const { generateTasks } = useAIGeneration();
    const result = await generateTasks({
      keyResultTitle: 'Test',
      targetValue: 100,
      currentValue: 0,
      timeRemaining: 30,
    });

    expect(result).toEqual(mockResponse);
    expect(result.tasks).toHaveLength(2);
    expect(result.tasks[0].title).toBe('Task 1');
  });

  it('handles API errors correctly', async () => {
    const error = new Error('Network error');
    mockGenerateTasks.mockRejectedValue(error);

    const { generateTasks } = useAIGeneration();

    await expect(
      generateTasks({
        keyResultTitle: 'Test',
        targetValue: 100,
        currentValue: 0,
        timeRemaining: 30,
      }),
    ).rejects.toThrow('Network error');
  });

  it('handles quota exceeded error (429)', async () => {
    const error = new Error('429: Quota exceeded');
    mockGenerateTasks.mockRejectedValue(error);

    const { generateTasks } = useAIGeneration();

    await expect(
      generateTasks({
        keyResultTitle: 'Test',
        targetValue: 100,
        currentValue: 0,
        timeRemaining: 30,
      }),
    ).rejects.toThrow('429');
  });

  it('handles timeout error (504)', async () => {
    const error = new Error('504: Gateway timeout');
    mockGenerateTasks.mockRejectedValue(error);

    const { generateTasks } = useAIGeneration();

    await expect(
      generateTasks({
        keyResultTitle: 'Test',
        targetValue: 100,
        currentValue: 0,
        timeRemaining: 30,
      }),
    ).rejects.toThrow('504');
  });

  it('handles validation error (400)', async () => {
    const error = new Error('400: Invalid request');
    mockGenerateTasks.mockRejectedValue(error);

    const { generateTasks } = useAIGeneration();

    await expect(
      generateTasks({
        keyResultTitle: 'Test',
        targetValue: 100,
        currentValue: 0,
        timeRemaining: 30,
      }),
    ).rejects.toThrow('400');
  });

  it('returns tasks with correct structure', async () => {
    const mockResponse = {
      tasks: [
        {
          title: 'Setup CI/CD Pipeline',
          description: 'Configure automated testing and deployment',
          estimatedHours: 16,
          priority: 'high',
          dependencies: [],
          tags: ['devops', 'automation'],
        },
      ],
      tokenUsage: {
        promptTokens: 120,
        completionTokens: 180,
        totalTokens: 300,
      },
      generatedAt: 1234567890,
    };

    mockGenerateTasks.mockResolvedValue(mockResponse);

    const { generateTasks } = useAIGeneration();
    const result = await generateTasks({
      keyResultTitle: 'Improve DevOps',
      targetValue: 100,
      currentValue: 0,
      timeRemaining: 60,
    });

    const task = result.tasks[0];
    expect(task).toHaveProperty('title');
    expect(task).toHaveProperty('description');
    expect(task).toHaveProperty('estimatedHours');
    expect(task).toHaveProperty('priority');
    expect(task).toHaveProperty('dependencies');
    expect(task).toHaveProperty('tags');

    expect(result).toHaveProperty('tokenUsage');
    expect(result).toHaveProperty('generatedAt');
  });

  it('handles empty task list', async () => {
    mockGenerateTasks.mockResolvedValue({
      tasks: [],
      tokenUsage: { promptTokens: 50, completionTokens: 50, totalTokens: 100 },
      generatedAt: Date.now(),
    });

    const { generateTasks } = useAIGeneration();
    const result = await generateTasks({
      keyResultTitle: 'Test',
      targetValue: 100,
      currentValue: 0,
      timeRemaining: 30,
    });

    expect(result.tasks).toEqual([]);
    expect(result.tasks).toHaveLength(0);
  });

  it('handles optional parameters correctly', async () => {
    mockGenerateTasks.mockResolvedValue({
      tasks: [],
      tokenUsage: {},
      generatedAt: Date.now(),
    });

    const { generateTasks } = useAIGeneration();

    // Without optional params
    await generateTasks({
      keyResultTitle: 'Test',
      targetValue: 100,
      currentValue: 0,
      timeRemaining: 30,
    });

    expect(mockGenerateTasks).toHaveBeenCalledWith({
      keyResultTitle: 'Test',
      targetValue: 100,
      currentValue: 0,
      timeRemaining: 30,
    });

    // With optional params
    await generateTasks({
      keyResultTitle: 'Test 2',
      keyResultDescription: 'Description',
      targetValue: 50,
      currentValue: 25,
      unit: 'points',
      timeRemaining: 15,
    });

    expect(mockGenerateTasks).toHaveBeenCalledWith({
      keyResultTitle: 'Test 2',
      keyResultDescription: 'Description',
      targetValue: 50,
      currentValue: 25,
      unit: 'points',
      timeRemaining: 15,
    });
  });
});
