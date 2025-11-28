import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAIGenerationStore } from '../aiGenerationStore';
import type { AIProviderConfigClientDTO, AIUsageQuotaClientDTO, GeneratedGoalDraft } from '@dailyuse/contracts/ai';

type AIUsageQuotaClientDTO = AIUsageQuotaClientDTO;

describe('aiGenerationStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const store = useAIGenerationStore();

      expect(store.quota).toBeNull();
      expect(store.recentKeyResults).toEqual([]);
      expect(store.recentTasks).toEqual([]);
      expect(store.isGenerating).toBe(false);
      expect(store.isLoadingQuota).toBe(false);
      expect(store.error).toBeNull();
      expect(store.lastTaskUuid).toBeNull();
    });
  });

  describe('Quota Management', () => {
    it('should set quota', () => {
      const store = useAIGenerationStore();
      const mockQuota: AIUsageQuotaClientDTO = {
        uuid: 'quota-uuid',
        accountUuid: 'test-account-uuid',
        quotaLimit: 50,
        currentUsage: 10,
        remainingQuota: 40,
        resetPeriod: 'DAILY',
        lastResetAt: new Date().toISOString(),
        nextResetAt: new Date(Date.now() + 86400000).toISOString(),
      };

      store.setQuota(mockQuota);

      expect(store.quota).toEqual(mockQuota);
    });

    it('should update quota', () => {
      const store = useAIGenerationStore();
      const initialQuota: AIUsageQuotaClientDTO = {
        uuid: 'quota-uuid',
        accountUuid: 'test-account-uuid',
        quotaLimit: 50,
        currentUsage: 10,
        remainingQuota: 40,
        resetPeriod: 'DAILY',
        lastResetAt: new Date().toISOString(),
        nextResetAt: new Date(Date.now() + 86400000).toISOString(),
      };

      store.setQuota(initialQuota);

      const updatedQuota: AIUsageQuotaClientDTO = {
        ...initialQuota,
        currentUsage: 11,
        remainingQuota: 39,
      };

      store.updateQuota(updatedQuota);

      expect(store.quota?.currentUsage).toBe(11);
      expect(store.quota?.remainingQuota).toBe(39);
    });

    it('should compute hasQuota correctly', () => {
      const store = useAIGenerationStore();

      // No quota
      expect(store.hasQuota).toBe(false);

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
      expect(store.hasQuota).toBe(true);

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
      expect(store.hasQuota).toBe(false);
    });

    it('should compute quotaUsagePercentage correctly', () => {
      const store = useAIGenerationStore();

      // No quota
      expect(store.quotaUsagePercentage).toBe(0);

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
      expect(store.quotaUsagePercentage).toBe(20);

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
      expect(store.quotaUsagePercentage).toBe(100);
    });

    it('should compute quotaStatusText correctly', () => {
      const store = useAIGenerationStore();

      // No quota
      expect(store.quotaStatusText).toBe('加载中...');

      // Has quota
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
      expect(store.quotaStatusText).toBe('已用 10/50');

      // Quota exhausted
      store.updateQuota({
        currentUsage: 50,
        remainingQuota: 0,
      });
      expect(store.quotaStatusText).toBe('已用 50/50');
    });
  });

  describe('Key Results Management', () => {
    it('should add key results', () => {
      const store = useAIGenerationStore();
      const mockKeyResults = [
        { title: 'KR 1', targetValue: 100, unit: '%' },
        { title: 'KR 2', targetValue: 5, unit: 'hours' },
      ];

      store.addKeyResults(mockKeyResults, 'task-uuid-1');

      expect(store.recentKeyResults).toEqual(mockKeyResults);
      expect(store.lastTaskUuid).toBe('task-uuid-1');
      expect(store.recentTasks.length).toBe(1);
      expect(store.recentTasks[0].uuid).toBe('task-uuid-1');
    });

    it('should maintain maximum 20 recent tasks', () => {
      const store = useAIGenerationStore();

      // Add 25 results
      for (let i = 0; i < 25; i++) {
        store.addKeyResults([{ title: `KR ${i}`, targetValue: 100, unit: '%' }], `task-uuid-${i}`);
      }

      // Should only keep latest 20
      expect(store.recentTasks.length).toBe(20);
      expect(store.recentTasks[0].uuid).toBe('task-uuid-24');
      expect(store.recentTasks[19].uuid).toBe('task-uuid-5');
    });

    it('should get task by uuid', () => {
      const store = useAIGenerationStore();
      const mockKeyResults = [{ title: 'KR 1', targetValue: 100, unit: '%' }];

      store.addKeyResults(mockKeyResults, 'task-uuid-1');

      const task = store.getTaskByUuid('task-uuid-1');
      expect(task).toBeDefined();
      expect(task?.uuid).toBe('task-uuid-1');
      expect(task?.result).toEqual(mockKeyResults);

      const nonExistent = store.getTaskByUuid('non-existent');
      expect(nonExistent).toBeUndefined();
    });

    it('should clear results', () => {
      const store = useAIGenerationStore();
      store.addKeyResults([{ title: 'KR 1', targetValue: 100, unit: '%' }], 'task-uuid-1');

      expect(store.recentKeyResults.length).toBe(1);
      expect(store.lastTaskUuid).toBe('task-uuid-1');

      store.clearResults();

      expect(store.recentKeyResults.length).toBe(0);
      expect(store.lastTaskUuid).toBeNull();
    });
  });

  describe('Loading States', () => {
    it('should set generating state', () => {
      const store = useAIGenerationStore();

      expect(store.isGenerating).toBe(false);

      store.setGenerating(true);
      expect(store.isGenerating).toBe(true);

      store.setGenerating(false);
      expect(store.isGenerating).toBe(false);
    });

    it('should set loading quota state', () => {
      const store = useAIGenerationStore();

      expect(store.isLoadingQuota).toBe(false);

      store.setLoadingQuota(true);
      expect(store.isLoadingQuota).toBe(true);

      store.setLoadingQuota(false);
      expect(store.isLoadingQuota).toBe(false);
    });
  });

  describe('Error Management', () => {
    it('should set error', () => {
      const store = useAIGenerationStore();

      expect(store.error).toBeNull();

      store.setError('Test error');
      expect(store.error).toBe('Test error');
    });

    it('should clear error', () => {
      const store = useAIGenerationStore();
      store.setError('Test error');

      expect(store.error).toBe('Test error');

      store.clearError();
      expect(store.error).toBeNull();
    });
  });

  describe('Reset', () => {
    it('should reset all state', () => {
      const store = useAIGenerationStore();

      // Set up some state
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
      store.addKeyResults([{ title: 'KR 1', targetValue: 100, unit: '%' }], 'task-uuid-1');
      store.setError('Test error');
      store.setGenerating(true);
      store.setLoadingQuota(true);

      // Reset
      store.reset();

      // Verify reset
      expect(store.quota).toBeNull();
      expect(store.recentKeyResults).toEqual([]);
      expect(store.recentTasks).toEqual([]);
      expect(store.isGenerating).toBe(false);
      expect(store.isLoadingQuota).toBe(false);
      expect(store.error).toBeNull();
      expect(store.lastTaskUuid).toBeNull();
    });
  });
});

