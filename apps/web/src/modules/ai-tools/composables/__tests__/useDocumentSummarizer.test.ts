/**
 * useDocumentSummarizer Composable Unit Tests
 * 测试组合函数的所有状态、计算属性和方法
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { nextTick } from 'vue';
import { useDocumentSummarizer } from '../useDocumentSummarizer';
import type { SummaryResult } from '../../types/summarization';

// Create mock functions
const mockApiPost: Mock = vi.fn();
const mockShowSuccess: Mock = vi.fn();
const mockShowError: Mock = vi.fn();
const mockClipboardWriteText: Mock = vi.fn();

// Mock modules
vi.mock('@/shared/api/instances', () => ({
  apiClient: {
    post: mockApiPost,
  },
}));

vi.mock('@/shared/composables/useSnackbar', () => ({
  useSnackbar: vi.fn(() => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
  })),
}));

vi.mock('@dailyuse/utils', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
  })),
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: mockClipboardWriteText,
  },
});

describe('useDocumentSummarizer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const {
        inputText,
        summary,
        isLoading,
        error,
        includeActions,
        language,
        characterCount,
        isTextValid,
        canSummarize,
      } = useDocumentSummarizer();

      expect(inputText.value).toBe('');
      expect(summary.value).toBeNull();
      expect(isLoading.value).toBe(false);
      expect(error.value).toBeNull();
      expect(includeActions.value).toBe(true);
      expect(language.value).toBe('zh-CN');
      expect(characterCount.value).toBe(0);
      expect(isTextValid.value).toBe(false);
      expect(canSummarize.value).toBe(false);
    });
  });

  describe('Computed Properties', () => {
    describe('characterCount', () => {
      it('should return correct character count', () => {
        const { inputText, characterCount } = useDocumentSummarizer();

        inputText.value = 'Hello World';
        expect(characterCount.value).toBe(11);

        inputText.value = '你好世界';
        expect(characterCount.value).toBe(4);
      });
    });

    describe('isTextValid', () => {
      it('should return false for empty text', () => {
        const { inputText, isTextValid } = useDocumentSummarizer();
        inputText.value = '';
        expect(isTextValid.value).toBe(false);
      });

      it('should return true for valid text', () => {
        const { inputText, isTextValid } = useDocumentSummarizer();
        inputText.value = 'Valid text';
        expect(isTextValid.value).toBe(true);
      });

      it('should return false for text exceeding max length', () => {
        const { inputText, isTextValid } = useDocumentSummarizer();
        inputText.value = 'a'.repeat(50001);
        expect(isTextValid.value).toBe(false);
      });
    });

    describe('canSummarize', () => {
      it('should return true when text is valid and not loading', () => {
        const { inputText, canSummarize } = useDocumentSummarizer();
        inputText.value = 'Valid text for summarization';
        expect(canSummarize.value).toBe(true);
      });
    });
  });

  describe('summarize()', () => {
    it('should successfully call API and update state', async () => {
      const mockResult: SummaryResult = {
        summary: {
          core: 'This is the core summary',
          keyPoints: ['Point 1', 'Point 2', 'Point 3'],
          actionItems: ['Action 1', 'Action 2'],
        },
        metadata: {
          tokensUsed: 250,
          generatedAt: Date.now(),
          inputLength: 1000,
          compressionRatio: 0.15,
        },
      };

      mockApiPost.mockResolvedValueOnce({ data: mockResult });

      const { inputText, includeActions, summarize, summary, isLoading, error } =
        useDocumentSummarizer();

      inputText.value = 'Test document to summarize';
      includeActions.value = true;

      await summarize();

      expect(isLoading.value).toBe(false);
      expect(error.value).toBeNull();
      expect(summary.value).toEqual(mockResult);
      expect(mockApiPost).toHaveBeenCalledWith('/api/ai/summarize', {
        text: 'Test document to summarize',
        includeActions: true,
        language: 'zh-CN',
      });
    });

    it('should handle 401 unauthorized error', async () => {
      mockApiPost.mockRejectedValueOnce({
        response: { status: 401 },
      });

      const { inputText, summarize, error } = useDocumentSummarizer();
      inputText.value = 'Test text';

      await summarize();

      expect(error.value).toBe('请先登录以使用 AI 功能');
    });

    it('should handle 429 quota exceeded error', async () => {
      mockApiPost.mockRejectedValueOnce({
        response: { status: 429 },
      });

      const { inputText, summarize, error } = useDocumentSummarizer();
      inputText.value = 'Test text';

      await summarize();

      expect(error.value).toBe('AI 使用配额已用尽，请稍后再试');
    });

    it('should handle 500 server error', async () => {
      mockApiPost.mockRejectedValueOnce({
        response: { status: 500 },
      });

      const { inputText, summarize, error } = useDocumentSummarizer();
      inputText.value = 'Test text';

      await summarize();

      expect(error.value).toBe('AI 服务暂时不可用，请稍后再试');
    });
  });

  describe('copyToClipboard()', () => {
    it('should format and copy summary to clipboard', async () => {
      const { summary, copyToClipboard } = useDocumentSummarizer();

      summary.value = {
        summary: {
          core: 'This is the main point',
          keyPoints: ['Key 1', 'Key 2'],
          actionItems: ['Action 1'],
        },
        metadata: {
          tokensUsed: 100,
          generatedAt: Date.now(),
          inputLength: 500,
          compressionRatio: 0.2,
        },
      };

      mockClipboardWriteText.mockResolvedValueOnce(undefined);

      await copyToClipboard();

      expect(mockClipboardWriteText).toHaveBeenCalled();
      const copiedText = mockClipboardWriteText.mock.calls[0][0];

      expect(copiedText).toContain('核心摘要:');
      expect(copiedText).toContain('This is the main point');
      expect(copiedText).toContain('关键要点:');
      expect(mockShowSuccess).toHaveBeenCalledWith('摘要已复制到剪贴板');
    });

    it('should show error when no summary exists', async () => {
      const { summary, copyToClipboard } = useDocumentSummarizer();
      summary.value = null;

      await copyToClipboard();

      expect(mockShowError).toHaveBeenCalledWith('没有可复制的摘要');
      expect(mockClipboardWriteText).not.toHaveBeenCalled();
    });

    it('should handle clipboard permission error', async () => {
      const { summary, copyToClipboard } = useDocumentSummarizer();

      summary.value = {
        summary: {
          core: 'Test',
          keyPoints: ['Key'],
        },
        metadata: {
          tokensUsed: 10,
          generatedAt: Date.now(),
          inputLength: 50,
          compressionRatio: 0.2,
        },
      };

      mockClipboardWriteText.mockRejectedValueOnce(new Error('Permission denied'));

      await copyToClipboard();

      expect(mockShowError).toHaveBeenCalledWith('复制失败，请手动复制');
    });
  });

  describe('reset()', () => {
    it('should reset all state to initial values', async () => {
      const { inputText, summary, error, includeActions, reset } = useDocumentSummarizer();

      // Set some values
      inputText.value = 'Some text';
      summary.value = {
        summary: { core: 'test', keyPoints: ['a'] },
        metadata: {
          tokensUsed: 10,
          generatedAt: Date.now(),
          inputLength: 10,
          compressionRatio: 0.1,
        },
      };
      error.value = 'Some error';
      includeActions.value = false;

      // Reset
      reset();

      await nextTick();

      expect(inputText.value).toBe('');
      expect(summary.value).toBeNull();
      expect(error.value).toBeNull();
      expect(includeActions.value).toBe(true);
    });
  });
});
