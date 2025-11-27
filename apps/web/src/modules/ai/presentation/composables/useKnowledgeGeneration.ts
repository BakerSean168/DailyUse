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
  const task = ref<KnowledgeGenerationTask | null>(null);
  const documents = ref<GeneratedDocument[]>([]);
  const isGenerating = ref<boolean>(false);
  const error = ref<string | null>(null);
  const currentStep = ref<number>(1);
  let pollingInterval: ReturnType<typeof setInterval> | null = null;
  const documentCount = ref<number>(5);
  const targetAudience = ref<string>('Beginners');

  const progress = computed(() => task.value?.progress || 0);
  const isCompleted = computed(() => task.value?.status === 'COMPLETED');
  const isFailed = computed(() => task.value?.status === 'FAILED');
  const estimatedTime = computed(() => {
    if (!task.value?.estimatedTimeRemaining) return null;
    const seconds = task.value.estimatedTimeRemaining;
    if (seconds < 60) return `~${Math.round(seconds)}秒`;
    const minutes = Math.round(seconds / 60);
    return `~${minutes}分钟`;
  });
  const documentPreviews = computed<GeneratedDocumentPreview[]>(
    () => task.value?.generatedDocuments || [],
  );

  async function startGeneration(request: KnowledgeGenerationRequest): Promise<void> {
    try {
      error.value = null;
      isGenerating.value = true;
      documentCount.value = request.documentCount;
      targetAudience.value = request.targetAudience;
      const response = await api.post<{ taskUuid: string }>(
        '/api/ai/generate/knowledge-series',
        request,
      );
      await startPolling(response.taskUuid);
      currentStep.value = 2;
    } catch (err: any) {
      isGenerating.value = false;
      error.value = mapErrorToMessage(err);
      throw err;
    }
  }

  function startPolling(taskUuid: string): void {
    pollProgress(taskUuid);
    pollingInterval = setInterval(async () => {
      await pollProgress(taskUuid);
    }, 2000);
  }

  async function pollProgress(taskUuid: string): Promise<void> {
    try {
      const response = await api.get<KnowledgeGenerationTask>(
        `/api/ai/generate/knowledge-series/${taskUuid}`,
      );
      task.value = response;
      if (response.status === 'COMPLETED' || response.status === 'FAILED') {
        stopPolling();
        isGenerating.value = false;
        if (response.status === 'COMPLETED') {
          await fetchDocuments(taskUuid);
          currentStep.value = 3;
        } else {
          error.value = response.error || '知识库生成失败，请重试。';
        }
      }
    } catch (err: any) {
      stopPolling();
      isGenerating.value = false;
      error.value = mapErrorToMessage(err);
    }
  }

  function stopPolling(): void {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  }

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

  function discardDocument(uuid: string): void {
    documents.value = documents.value.filter((d) => d.uuid !== uuid);
  }
  function cancelTask(): void {
    stopPolling();
    isGenerating.value = false;
  }
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
  onUnmounted(() => {
    stopPolling();
  });
  return {
    task,
    documents,
    isGenerating,
    error,
    currentStep,
    documentCount,
    targetAudience,
    progress,
    isCompleted,
    isFailed,
    estimatedTime,
    documentPreviews,
    startGeneration,
    fetchDocuments,
    discardDocument,
    cancelTask,
    reset,
  };
}
