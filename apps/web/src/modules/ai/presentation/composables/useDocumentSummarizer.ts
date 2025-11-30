/**
 * useDocumentSummarizer Composable
 * 文档摘要功能的状态管理和业务逻辑
 */

import { ref, computed } from 'vue';
import { apiClient } from '@/shared/api/instances';
import type { SummaryResult, SummarizationRequest } from '../types/summarization';
import { createLogger } from '@dailyuse/utils';
import { useSnackbar } from '@/shared/composables/useSnackbar';

const logger = createLogger('useDocumentSummarizer');

export function useDocumentSummarizer() {
  // ============ State ============
  const inputText = ref<string>('');
  const summary = ref<SummaryResult | null>(null);
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const includeActions = ref<boolean>(true);
  const language = ref<'zh-CN' | 'en'>('zh-CN');

  const snackbar = useSnackbar();

  // ============ Computed ============
  const characterCount = computed(() => inputText.value.length);
  const isTextValid = computed(() => characterCount.value >= 1 && characterCount.value <= 50000);
  const canSummarize = computed(() => isTextValid.value && !isLoading.value);

  // ============ Methods ============

  /**
   * 调用摘要 API
   */
  async function summarize(): Promise<void> {
    if (!canSummarize.value) {
      logger.warn('Cannot summarize: invalid state', {
        isTextValid: isTextValid.value,
        isLoading: isLoading.value,
      });
      return;
    }

    // 清除之前的错误和结果
    error.value = null;
    summary.value = null;
    isLoading.value = true;

    try {
      logger.info('Starting summarization', {
        textLength: inputText.value.length,
        includeActions: includeActions.value,
        language: language.value,
      });

      const request: SummarizationRequest = {
        text: inputText.value,
        language: language.value,
        includeActions: includeActions.value,
      };

      const response = await apiClient.post<SummaryResult>('/api/ai/summarize', request);

      summary.value = response;
      logger.info('Summarization successful', {
        tokensUsed: response.metadata.tokensUsed,
        compressionRatio: response.metadata.compressionRatio,
      });
    } catch (err: any) {
      logger.error('Summarization failed', { error: err });
      error.value = mapErrorToMessage(err);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 将摘要复制到剪贴板
   */
  async function copyToClipboard(): Promise<void> {
    if (!summary.value) {
      logger.warn('No summary to copy');
      snackbar.showError('没有可复制的摘要');
      return;
    }

    try {
      const formattedText = formatSummaryForClipboard(summary.value);

      await navigator.clipboard.writeText(formattedText);

      snackbar.showSuccess('摘要已复制到剪贴板');

      logger.info('Summary copied to clipboard');
    } catch (err: any) {
      logger.error('Failed to copy to clipboard', { error: err });
      snackbar.showError('复制失败，请手动复制');
    }
  }

  /**
   * 重置所有状态
   */
  function reset(): void {
    inputText.value = '';
    summary.value = null;
    error.value = null;
    isLoading.value = false;
    logger.info('State reset');
  }

  // ============ Helper Functions ============

  /**
   * 格式化摘要为纯文本（用于剪贴板）
   */
  function formatSummaryForClipboard(result: SummaryResult): string {
    const lines: string[] = [];

    // Core Summary
    lines.push('核心摘要：');
    lines.push(result.summary.core);
    lines.push('');

    // Key Points
    lines.push('关键要点：');
    result.summary.keyPoints.forEach((point, index) => {
      lines.push(`${index + 1}. ${point}`);
    });
    lines.push('');

    // Action Items (if present)
    if (result.summary.actionItems && result.summary.actionItems.length > 0) {
      lines.push('行动建议：');
      result.summary.actionItems.forEach((item, index) => {
        lines.push(`${index + 1}. ${item}`);
      });
      lines.push('');
    }

    // Metadata
    lines.push('---');
    lines.push(`使用 Token: ${result.metadata.tokensUsed}`);
    lines.push(`压缩率: ${(result.metadata.compressionRatio * 100).toFixed(1)}%`);
    lines.push(`原文长度: ${result.metadata.inputLength} 字符`);

    return lines.join('\n');
  }

  /**
   * 将 API 错误映射为用户友好的消息
   */
  function mapErrorToMessage(err: any): string {
    const status = err?.response?.status || err?.status;

    switch (status) {
      case 401:
        return '请先登录以使用此功能';
      case 429:
        return '今日配额已用完，请明天再试';
      case 504:
        return '请求超时，请尝试使用更短的文本';
      case 400:
        return '输入无效，文本长度必须在 1-50,000 字符之间';
      case 500:
        return '服务暂时不可用，请稍后再试';
      default:
        return err?.response?.data?.message || err?.message || '摘要生成失败，请重试';
    }
  }

  return {
    // State
    inputText,
    summary,
    isLoading,
    error,
    includeActions,
    language,

    // Computed
    characterCount,
    isTextValid,
    canSummarize,

    // Methods
    summarize,
    copyToClipboard,
    reset,
  };
}
