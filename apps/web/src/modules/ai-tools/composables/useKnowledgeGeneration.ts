/**
 * useKnowledgeGeneration Composable
 *
 * Manages state and API interactions for the Knowledge Generation Wizard.
 * Handles polling, progress tracking, and document management.
 */

import { ref, computed, onUnmounted } from 'vue';
import { api } from '@/shared/api/instances';
import type {
  KnowledgeGenerationTask,
  KnowledgeGenerationRequest,
  GeneratedDocumentPreview,
  GeneratedDocument,
  TaskStatus,
} from '../types/knowledgeGeneration';

export function useKnowledgeGeneration() {
  // ============================================================
  // State Management
  // ============================================================

  /** Current task state */
  const task = ref<KnowledgeGenerationTask | null>(null);

  /** Array of generated documents (fetched after completion) */
  const documents = ref<GeneratedDocument[]>([]);

  /** Whether generation is in progress */
  const isGenerating = ref<boolean>(false);

  /** Error message (if any) */
  const error = ref<string | null>(null);

  /** Current wizard step (1-4) */
  const currentStep = ref<number>(1);

  /** Polling interval reference */
  let pollingInterval: ReturnType<typeof setInterval> | null = null;

  /** Document count selector for UI restoration */
  const documentCount = ref<number>(5);

  /** Target audience selector for UI restoration */
  const targetAudience = ref<string>('Beginners');

  // ============================================================
  // Computed Properties
  // ============================================================

  /** Current progress (0-100) */
  const progress = computed(() => task.value?.progress || 0);

  /** Whether task is completed */
  const isCompleted = computed(() => task.value?.status === 'COMPLETED');

  /** Whether task has failed */
  const isFailed = computed(() => task.value?.status === 'FAILED');

  /** Estimated time remaining (formatted) */
  const estimatedTime = computed(() => {
    if (!task.value?.estimatedTimeRemaining) return null;

    const seconds = task.value.estimatedTimeRemaining;
    if (seconds < 60) return `~${Math.round(seconds)}秒`;
    const minutes = Math.round(seconds / 60);
    return `~${minutes}分钟`;
  });

  /** Generated document previews from task */
  const documentPreviews = computed<GeneratedDocumentPreview[]>(
    () => task.value?.generatedDocuments || [],
  );

  // ============================================================
  // API Methods
  // ============================================================

  /**
   * Start knowledge generation
   * POST /api/ai/generate/knowledge-series
   */
  async function startGeneration(request: KnowledgeGenerationRequest): Promise<void> {
    try {
      error.value = null;
      isGenerating.value = true;
      documentCount.value = request.documentCount;
      targetAudience.value = request.targetAudience;

      // Call backend to create task
      const response = await api.post<{ taskUuid: string }>(
        '/api/ai/generate/knowledge-series',
        request,
      );

      // Start polling for progress
      await startPolling(response.taskUuid);

      // Advance to step 2 (progress)
      currentStep.value = 2;
    } catch (err: any) {
      isGenerating.value = false;
      error.value = mapErrorToMessage(err);
      throw err;
    }
  }

  /**
   * Start polling interval for task progress
   */
  function startPolling(taskUuid: string): void {
    // Initial poll immediately
    pollProgress(taskUuid);

    // Poll every 2 seconds
    pollingInterval = setInterval(async () => {
      await pollProgress(taskUuid);
    }, 2000);
  }

  /**
   * Poll task progress
   * GET /api/ai/generate/knowledge-series/:taskId
   */
  async function pollProgress(taskUuid: string): Promise<void> {
    try {
      const response = await api.get<KnowledgeGenerationTask>(
        `/api/ai/generate/knowledge-series/${taskUuid}`,
      );

      task.value = response;

      // Stop polling if completed or failed
      if (response.status === 'COMPLETED' || response.status === 'FAILED') {
        stopPolling();
        isGenerating.value = false;

        if (response.status === 'COMPLETED') {
          // Fetch full documents
          await fetchDocuments(taskUuid);
          // Auto-advance to step 3 (review)
          currentStep.value = 3;
        } else {
          // Task failed - show error
          error.value = response.error || '知识库生成失败，请重试。';
        }
      }
    } catch (err: any) {
      // Network error during polling - stop polling and show error
      stopPolling();
      isGenerating.value = false;
      error.value = mapErrorToMessage(err);
    }
  }

  /**
   * Stop polling interval
   */
  function stopPolling(): void {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  }

  /**
   * Fetch generated documents after completion
   * GET /api/ai/generate/knowledge-series/:taskId/documents
   */
  async function fetchDocuments(taskUuid: string): Promise<void> {
    try {
      const response = await api.get<GeneratedDocument[]>(
        `/api/ai/generate/knowledge-series/${taskUuid}/documents`,
      );

      documents.value = response;
    } catch (err: any) {
      error.value = '无法加载生成的文档，请刷新页面重试。';
      console.error('Failed to fetch documents:', err);
    }
  }

  /**
   * Discard a document (local UI only, backend keeps it)
   */
  function discardDocument(uuid: string): void {
    documents.value = documents.value.filter((doc) => doc.uuid !== uuid);
  }

  /**
   * Cancel task - stop polling and clear state
   */
  function cancelTask(): void {
    stopPolling();
    isGenerating.value = false;
    // Note: Backend task continues running (no cancel endpoint in Story 4.3)
  }

  /**
   * Reset all state (for starting new generation)
   */
  function reset(): void {
    stopPolling();
    task.value = null;
    documents.value = [];
    isGenerating.value = false;
    error.value = null;
    currentStep.value = 1;
    documentCount.value = 5;
    targetAudience.value = 'Beginners';
  }

  // ============================================================
  // Error Handling
  // ============================================================

  /**
   * Map HTTP errors to user-friendly messages
   */
  function mapErrorToMessage(err: any): string {
    const status = err.response?.status;

    switch (status) {
      case 401:
        return '请登录后使用此功能。';
      case 429:
        return '今日配额已用完，请明天再试。';
      case 400:
        return '输入无效，请检查主题并重试。';
      case 500:
        return '服务暂时不可用，请稍后重试。';
      default:
        return err.response?.data?.message || '发生未知错误，请重试。';
    }
  }

  // ============================================================
  // Lifecycle
  // ============================================================

  /** Cleanup on unmount */
  onUnmounted(() => {
    stopPolling();
  });

  // ============================================================
  // Return Public API
  // ============================================================

  return {
    // State
    task,
    documents,
    isGenerating,
    error,
    currentStep,
    documentCount,
    targetAudience,

    // Computed
    progress,
    isCompleted,
    isFailed,
    estimatedTime,
    documentPreviews,

    // Methods
    startGeneration,
    fetchDocuments,
    discardDocument,
    cancelTask,
    reset,
  };
}
