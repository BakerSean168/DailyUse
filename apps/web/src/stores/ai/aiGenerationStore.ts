/**
 * AI Generation Store
 * AI 生成功能状态管理
 *
 * 职责：
 * - 管理 AI 生成任务的前端状态
 * - 缓存生成结果
 * - 管理用户配额状态
 * - 提供响应式查询接口
 *
 * 架构说明：
 * - 纯状态存储，不直接调用 API
 * - 业务逻辑由 ApplicationService 处理
 * - 使用 Composition API 风格
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { AIContracts } from '@dailyuse/contracts';

/**
 * AI Generation Store
 */
export const useAIGenerationStore = defineStore('aiGeneration', () => {
  // ============ State ============

  // 配额状态
  const quota = ref<AIContracts.AIUsageQuotaClientDTO | null>(null);

  // 最近的生成结果缓存
  const recentKeyResults = ref<any[]>([]);
  const recentTasks = ref<any[]>([]);

  // 加载状态
  const isGenerating = ref(false);
  const isLoadingQuota = ref(false);

  // 错误信息
  const error = ref<string | null>(null);

  // 最后一次生成的任务 UUID
  const lastTaskUuid = ref<string | null>(null);

  // ============ Getters ============

  /**
   * 是否有剩余配额
   */
  const hasQuota = computed(() => {
    if (!quota.value) return false;
    return quota.value.remainingQuota > 0;
  });

  /**
   * 配额使用百分比
   */
  const quotaUsagePercentage = computed(() => {
    if (!quota.value) return 0;
    return Math.round((quota.value.currentUsage / quota.value.quotaLimit) * 100);
  });

  /**
   * 距离下次重置的时间（格式化）
   */
  const timeToReset = computed(() => {
    if (!quota.value) return '';
    const now = Date.now();
    const resetTime = quota.value.nextResetAt;
    const diff = resetTime - now;

    if (diff <= 0) return '即将重置';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} 天后重置`;
    }

    if (hours > 0) {
      return `${hours} 小时 ${minutes} 分钟后重置`;
    }

    return `${minutes} 分钟后重置`;
  });

  /**
   * 配额状态描述
   */
  const quotaStatusText = computed(() => {
    if (!quota.value) return '加载中...';
    return `已用 ${quota.value.currentUsage}/${quota.value.quotaLimit}`;
  });

  // ============ Actions ============

  /**
   * 设置配额状态
   */
  function setQuota(newQuota: AIUsageQuotaClientDTO) {
    quota.value = newQuota;
  }

  /**
   * 更新配额（部分更新）
   */
  function updateQuota(updates: Partial<AIUsageQuotaClientDTO>) {
    if (quota.value) {
      quota.value = { ...quota.value, ...updates };
    }
  }

  /**
   * 添加生成的关键结果到缓存
   */
  function addKeyResults(keyResults: any[], taskUuid: string) {
    recentKeyResults.value = keyResults;
    lastTaskUuid.value = taskUuid;

    // 添加到任务历史
    recentTasks.value.unshift({
      uuid: taskUuid,
      type: 'GOAL_KEY_RESULTS' as GenerationTaskType,
      result: keyResults,
      createdAt: Date.now(),
    });

    // 最多保留 20 个任务记录
    if (recentTasks.value.length > 20) {
      recentTasks.value = recentTasks.value.slice(0, 20);
    }
  }

  /**
   * 设置生成状态
   */
  function setGenerating(value: boolean) {
    isGenerating.value = value;
    if (value) {
      error.value = null;
    }
  }

  /**
   * 设置配额加载状态
   */
  function setLoadingQuota(value: boolean) {
    isLoadingQuota.value = value;
  }

  /**
   * 设置错误信息
   */
  function setError(message: string | null) {
    error.value = message;
  }

  /**
   * 清除错误信息
   */
  function clearError() {
    error.value = null;
  }

  /**
   * 清除缓存的生成结果
   */
  function clearResults() {
    recentKeyResults.value = [];
    lastTaskUuid.value = null;
  }

  /**
   * 重置所有状态
   */
  function reset() {
    quota.value = null;
    recentKeyResults.value = [];
    recentTasks.value = [];
    isGenerating.value = false;
    isLoadingQuota.value = false;
    error.value = null;
    lastTaskUuid.value = null;
  }

  /**
   * 根据任务 UUID 获取任务
   */
  function getTaskByUuid(taskUuid: string) {
    return recentTasks.value.find((task) => task.uuid === taskUuid);
  }

  // ============ Return ============

  return {
    // State
    quota,
    recentKeyResults,
    recentTasks,
    isGenerating,
    isLoadingQuota,
    error,
    lastTaskUuid,

    // Getters
    hasQuota,
    quotaUsagePercentage,
    timeToReset,
    quotaStatusText,

    // Actions
    setQuota,
    updateQuota,
    addKeyResults,
    setGenerating,
    setLoadingQuota,
    setError,
    clearError,
    clearResults,
    reset,
    getTaskByUuid,
  };
});
