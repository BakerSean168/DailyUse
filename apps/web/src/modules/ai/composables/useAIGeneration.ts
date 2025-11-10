/**
 * useAIGeneration Composable
 * AI 生成功能组合式 API
 *
 * 职责：
 * - 连接 Pinia Store 和 API Client
 * - 提供响应式的状态和方法
 * - 处理错误和加载状态
 * - 提供友好的 API 接口给组件使用
 *
 * 使用示例：
 * ```vue
 * <script setup>
 * import { useAIGeneration } from '@/modules/ai/composables/useAIGeneration';
 * 
 * const { generateKeyResults, isGenerating, error, quota } = useAIGeneration();
 * 
 * async function handleGenerate() {
 *   const result = await generateKeyResults({
 *     goalTitle: '学习 Vue 3',
 *     goalDescription: '深入掌握 Vue 3 Composition API'
 *   });
 *   console.log(result.keyResults);
 * }
 * </script>
 * ```
 */

import { computed } from 'vue';
import { useAIGenerationStore } from '@/stores/ai/aiGenerationStore';
import { aiGenerationApiClient } from '../api/aiGenerationApiClient';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('useAIGeneration');

/**
 * AI Generation Composable
 */
export function useAIGeneration() {
  const store = useAIGenerationStore();

  // ============ Computed Properties ============

  /**
   * 是否正在生成
   */
  const isGenerating = computed(() => store.isGenerating);

  /**
   * 是否正在加载配额
   */
  const isLoadingQuota = computed(() => store.isLoadingQuota);

  /**
   * 错误信息
   */
  const error = computed(() => store.error);

  /**
   * 配额状态
   */
  const quota = computed(() => store.quota);

  /**
   * 最近的关键结果
   */
  const recentKeyResults = computed(() => store.recentKeyResults);

  /**
   * 是否有剩余配额
   */
  const hasQuota = computed(() => store.hasQuota);

  /**
   * 配额使用百分比
   */
  const quotaUsagePercentage = computed(() => store.quotaUsagePercentage);

  /**
   * 距离下次重置的时间
   */
  const timeToReset = computed(() => store.timeToReset);

  /**
   * 配额状态描述
   */
  const quotaStatusText = computed(() => store.quotaStatusText);

  // ============ Methods ============

  /**
   * 生成关键结果
   */
  async function generateKeyResults(params: {
    goalTitle: string;
    goalDescription?: string;
    category?: string;
    importance?: string;
    urgency?: string;
  }) {
    try {
      store.setGenerating(true);
      store.clearError();

      logger.info('Generating key results', { goalTitle: params.goalTitle });

      // 调用 API
      const result = await aiGenerationApiClient.generateKeyResults(params);

      // 更新 Store
      store.addKeyResults(result.keyResults, result.taskUuid);
      store.setQuota(result.quota);

      logger.info('Key results generated successfully', {
        count: result.keyResults.length,
        taskUuid: result.taskUuid,
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate key results';
      store.setError(errorMessage);
      logger.error('Failed to generate key results', { error: err });
      throw err;
    } finally {
      store.setGenerating(false);
    }
  }

  /**
   * 生成任务模板
   */
  async function generateTaskTemplate(params: {
    krTitle: string;
    krDescription?: string;
    targetValue?: number;
    unit?: string;
  }) {
    try {
      store.setGenerating(true);
      store.clearError();

      const result = await aiGenerationApiClient.generateTaskTemplate(params);

      logger.info('Task template generated successfully');

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate task template';
      store.setError(errorMessage);
      logger.error('Failed to generate task template', { error: err });
      throw err;
    } finally {
      store.setGenerating(false);
    }
  }

  /**
   * 生成知识文档
   */
  async function generateKnowledgeDocument(params: {
    topic: string;
    context?: string;
    templateType: string;
  }) {
    try {
      store.setGenerating(true);
      store.clearError();

      const result = await aiGenerationApiClient.generateKnowledgeDocument(params);

      logger.info('Knowledge document generated successfully');

      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to generate knowledge document';
      store.setError(errorMessage);
      logger.error('Failed to generate knowledge document', { error: err });
      throw err;
    } finally {
      store.setGenerating(false);
    }
  }

  /**
   * 获取配额状态
   */
  async function loadQuotaStatus() {
    try {
      store.setLoadingQuota(true);
      store.clearError();

      const quotaData = await aiGenerationApiClient.getQuotaStatus();
      store.setQuota(quotaData);

      logger.info('Quota status loaded', { quota: quotaData });

      return quotaData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load quota status';
      store.setError(errorMessage);
      logger.error('Failed to load quota status', { error: err });
      throw err;
    } finally {
      store.setLoadingQuota(false);
    }
  }

  /**
   * 清除错误
   */
  function clearError() {
    store.clearError();
  }

  /**
   * 清除结果
   */
  function clearResults() {
    store.clearResults();
  }

  /**
   * 重置所有状态
   */
  function reset() {
    store.reset();
  }

  // ============ Return ============

  return {
    // Computed
    isGenerating,
    isLoadingQuota,
    error,
    quota,
    recentKeyResults,
    hasQuota,
    quotaUsagePercentage,
    timeToReset,
    quotaStatusText,

    // Methods
    generateKeyResults,
    generateTaskTemplate,
    generateKnowledgeDocument,
    loadQuotaStatus,
    clearError,
    clearResults,
    reset,
  };
}
