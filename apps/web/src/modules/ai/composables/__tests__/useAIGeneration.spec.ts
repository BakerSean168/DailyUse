import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useAIGeneration } from '../useAIGeneration';
import { setActivePinia, createPinia } from 'pinia';
import { useAIGenerationStore } from '../../../../stores/ai/aiGenerationStore';
import { useAuthenticationStore } from '../../../authentication/presentation/stores/authenticationStore';
import * as aiGenerationApiClient from '../../api/aiGenerationApiClient';

// Mock API Client
vi.mock('../../api/aiGenerationApiClient', () => ({
  aiGenerationApiClient: {
    generateKeyResults: vi.fn(),
    getQuotaStatus: vi.fn(),
    generateTaskTemplate: vi.fn(),
    generateKnowledgeDocument: vi.fn(),
  },
}));

// Mock Authentication Store
vi.mock('../../../authentication/presentation/stores/authenticationStore', () => ({
  useAuthenticationStore: vi.fn(() => ({
    account: {
      uuid: 'test-account-uuid',
      name: 'Test User',
      email: 'test@example.com',
    },
  })),
}));

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('useAIGeneration', () => {
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    // Create fresh Pinia instance
    pinia = createPinia();
    setActivePinia(pinia);

    // Mock console to suppress logs during tests
    console.log = vi.fn();
    console.error = vi.fn();

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore console
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const {
        isGenerating,
        error,
        quota,
        hasQuota,
        quotaUsagePercentage,
        timeToReset,
        quotaStatusText,
        recentKeyResults,
      } = useAIGeneration();

      expect(isGenerating.value).toBe(false);
      expect(error.value).toBeNull();
      expect(quota.value).toBeNull();
      expect(hasQuota.value).toBe(false);
      expect(quotaUsagePercentage.value).toBe(0);
      expect(timeToReset.value).toBe(''); // Store returns '' not null
      expect(quotaStatusText.value).toBe('加载中...');
      expect(recentKeyResults.value).toEqual([]);
    });
  });

  describe('generateKeyResults', () => {
    it('should successfully generate key results', async () => {
      const mockResult = {
        taskUuid: 'task-uuid',
        keyResults: [
          {
            title: 'KR 1',
            targetValue: 100,
            unit: '%',
            weight: 50,
          },
          {
            title: 'KR 2',
            targetValue: 5,
            unit: 'hours',
            weight: 50,
          },
        ],
        quota: {
          uuid: 'quota-uuid',
          accountUuid: 'test-account-uuid',
          quotaLimit: 50,
          currentUsage: 1,
          remainingQuota: 49,
          resetPeriod: 'DAILY',
          lastResetAt: new Date().toISOString(),
          nextResetAt: new Date(Date.now() + 86400000).toISOString(),
        },
      };

      vi.mocked(aiGenerationApiClient.aiGenerationApiClient.generateKeyResults).mockResolvedValue(
        mockResult,
      );

      const { generateKeyResults, isGenerating, error, quota, recentKeyResults } =
        useAIGeneration();

      const params = {
        goalTitle: 'Test Goal',
        goalDescription: 'Test Description',
        category: 'work',
        importance: 'high',
        urgency: 'urgent',
      };

      const result = await generateKeyResults(params);

      expect(isGenerating.value).toBe(false);
      expect(error.value).toBeNull();
      expect(result).toEqual(mockResult);
      expect(quota.value).toEqual(mockResult.quota);
      // recentKeyResults 应该是 keyResults 数组本身
      expect(recentKeyResults.value).toEqual(mockResult.keyResults);
    });

    it('should set loading state during generation', async () => {
      const mockResult = {
        taskUuid: 'task-uuid',
        keyResults: [],
        quota: {} as any,
      };

      let resolveGeneration: any;
      const generationPromise = new Promise((resolve) => {
        resolveGeneration = () => resolve(mockResult);
      });

      vi.mocked(aiGenerationApiClient.aiGenerationApiClient.generateKeyResults).mockReturnValue(
        generationPromise as any,
      );

      const { generateKeyResults, isGenerating } = useAIGeneration();

      const promise = generateKeyResults({ goalTitle: 'Test Goal' });

      // Should be loading
      expect(isGenerating.value).toBe(true);

      // Resolve the promise
      resolveGeneration();
      await promise;

      // Should no longer be loading
      expect(isGenerating.value).toBe(false);
    });

    it('should handle API errors', async () => {
      const mockError = new Error('Quota exhausted');
      (mockError as any).response = {
        data: { message: 'Quota exhausted' },
      };

      vi.mocked(aiGenerationApiClient.aiGenerationApiClient.generateKeyResults).mockRejectedValue(
        mockError,
      );

      const { generateKeyResults, error, isGenerating } = useAIGeneration();

      await expect(
        generateKeyResults({ goalTitle: 'Test Goal' }),
      ).rejects.toThrow();

      expect(isGenerating.value).toBe(false);
      // Error message comes from err.message
      expect(error.value).toBe('Quota exhausted');
    });

    it('should handle errors without response', async () => {
      const mockError = new Error('Network error');

      vi.mocked(aiGenerationApiClient.aiGenerationApiClient.generateKeyResults).mockRejectedValue(
        mockError,
      );

      const { generateKeyResults, error } = useAIGeneration();

      await expect(
        generateKeyResults({ goalTitle: 'Test Goal' }),
      ).rejects.toThrow();

      expect(error.value).toBe('Network error');
    });

    it('should clear error before generation', async () => {
      const store = useAIGenerationStore();
      store.setError('Previous error');

      const mockResult = {
        taskUuid: 'task-uuid',
        keyResults: [],
        quota: {} as any,
      };

      vi.mocked(aiGenerationApiClient.aiGenerationApiClient.generateKeyResults).mockResolvedValue(
        mockResult,
      );

      const { generateKeyResults, error } = useAIGeneration();

      await generateKeyResults({ goalTitle: 'Test Goal' });

      expect(error.value).toBeNull();
    });
  });

  describe('loadQuotaStatus', () => {
    it('should successfully load quota status', async () => {
      const mockQuota = {
        uuid: 'quota-uuid',
        accountUuid: 'test-account-uuid',
        quotaLimit: 50,
        currentUsage: 10,
        remainingQuota: 40,
        resetPeriod: 'DAILY' as const,
        lastResetAt: new Date().toISOString(),
        nextResetAt: new Date(Date.now() + 86400000).toISOString(),
      };

      vi.mocked(aiGenerationApiClient.aiGenerationApiClient.getQuotaStatus).mockResolvedValue(
        mockQuota,
      );

      const { loadQuotaStatus, quota } = useAIGeneration();

      await loadQuotaStatus();

      expect(quota.value).toEqual(mockQuota);
    });

    it('should handle quota load errors', async () => {
      const mockError = new Error('Failed to load quota');

      vi.mocked(aiGenerationApiClient.aiGenerationApiClient.getQuotaStatus).mockRejectedValue(
        mockError,
      );

      const { loadQuotaStatus } = useAIGeneration();

      await expect(loadQuotaStatus()).rejects.toThrow('Failed to load quota');
    });

    it('should throw error if not authenticated', async () => {
      // Mock authenticationStore to return null account
      vi.mocked(useAuthenticationStore).mockReturnValueOnce({
        account: null,
      } as any);

      const { loadQuotaStatus } = useAIGeneration();

      await expect(loadQuotaStatus()).rejects.toThrow();
    });
  });

  describe('Computed Properties', () => {
    it('should compute hasQuota correctly', () => {
      const store = useAIGenerationStore();
      const { hasQuota } = useAIGeneration();

      // No quota
      expect(hasQuota.value).toBe(false);

      // Quota with remaining
      store.setQuota({
        uuid: 'quota-uuid',
        accountUuid: 'test-account-uuid',
        quotaLimit: 50,
        currentUsage: 10,
        remainingQuota: 40,
        resetPeriod: 'DAILY',
        lastResetAt: new Date().toISOString(),
        nextResetAt: new Date(Date.now() + 86400000).toISOString(),
      });
      expect(hasQuota.value).toBe(true);

      // Quota exhausted
      store.updateQuota({
        uuid: 'quota-uuid',
        accountUuid: 'test-account-uuid',
        quotaLimit: 50,
        currentUsage: 50,
        remainingQuota: 0,
        resetPeriod: 'DAILY',
        lastResetAt: new Date().toISOString(),
        nextResetAt: new Date(Date.now() + 86400000).toISOString(),
      });
      expect(hasQuota.value).toBe(false);
    });

    it('should compute quotaUsagePercentage correctly', () => {
      const store = useAIGenerationStore();
      const { quotaUsagePercentage } = useAIGeneration();

      // No quota
      expect(quotaUsagePercentage.value).toBe(0);

      // 20% usage
      store.setQuota({
        uuid: 'quota-uuid',
        accountUuid: 'test-account-uuid',
        quotaLimit: 50,
        currentUsage: 10,
        remainingQuota: 40,
        resetPeriod: 'DAILY',
        lastResetAt: new Date().toISOString(),
        nextResetAt: new Date(Date.now() + 86400000).toISOString(),
      });
      expect(quotaUsagePercentage.value).toBe(20);

      // 100% usage
      store.updateQuota({
        uuid: 'quota-uuid',
        accountUuid: 'test-account-uuid',
        quotaLimit: 50,
        currentUsage: 50,
        remainingQuota: 0,
        resetPeriod: 'DAILY',
        lastResetAt: new Date().toISOString(),
        nextResetAt: new Date(Date.now() + 86400000).toISOString(),
      });
      expect(quotaUsagePercentage.value).toBe(100);
    });
  });

  describe('Utility Methods', () => {
    it('should clear error', () => {
      const store = useAIGenerationStore();
      store.setError('Test error');

      const { clearError, error } = useAIGeneration();

      expect(error.value).toBe('Test error');
      clearError();
      expect(error.value).toBeNull();
    });

    it('should clear results', () => {
      const store = useAIGenerationStore();
      store.addKeyResults([{ title: 'Test', targetValue: 100, unit: '%' }], 'test-uuid');

      const { clearResults, recentKeyResults } = useAIGeneration();

      expect(recentKeyResults.value.length).toBe(1);
      clearResults();
      expect(recentKeyResults.value.length).toBe(0);
    });

    it('should reset all state', () => {
      const store = useAIGenerationStore();
      store.setQuota({
        uuid: 'quota-uuid',
        accountUuid: 'test-account-uuid',
        quotaLimit: 50,
        currentUsage: 10,
        remainingQuota: 40,
        resetPeriod: 'DAILY',
        lastResetAt: new Date().toISOString(),
        nextResetAt: new Date(Date.now() + 86400000).toISOString(),
      });
      store.addKeyResults([{ title: 'Test', targetValue: 100, unit: '%' }], 'test-uuid');
      store.setError('Test error');

      const { reset, quota, recentKeyResults, error } = useAIGeneration();

      reset();

      expect(quota.value).toBeNull();
      expect(recentKeyResults.value.length).toBe(0);
      expect(error.value).toBeNull();
    });
  });

  describe('Unimplemented Methods', () => {
    it('should call API for generateTaskTemplate', async () => {
      const mockResult = { success: true };
      vi.mocked(aiGenerationApiClient.aiGenerationApiClient.generateTaskTemplate).mockResolvedValue(
        mockResult as any,
      );

      const { generateTaskTemplate } = useAIGeneration();

      const result = await generateTaskTemplate({ krTitle: 'Test KR' } as any);
      expect(result).toEqual(mockResult);
    });

    it('should call API for generateKnowledgeDocument', async () => {
      const mockResult = { success: true };
      vi.mocked(
        aiGenerationApiClient.aiGenerationApiClient.generateKnowledgeDocument,
      ).mockResolvedValue(mockResult as any);

      const { generateKnowledgeDocument } = useAIGeneration();

      const result = await generateKnowledgeDocument({
        topic: 'Test',
        templateType: 'guide',
      } as any);
      expect(result).toEqual(mockResult);
    });
  });
});
