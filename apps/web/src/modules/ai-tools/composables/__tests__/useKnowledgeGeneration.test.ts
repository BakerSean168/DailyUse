/**
 * useKnowledgeGeneration Composable Tests
 *
 * Unit tests for the Knowledge Generation composable, including:
 * - State initialization
 * - API calls and polling lifecycle
 * - Document management
 * - Error handling
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useKnowledgeGeneration } from '../useKnowledgeGeneration';
import { api } from '@/shared/api/instances';
import type {
  KnowledgeGenerationTask,
  KnowledgeGenerationRequest,
  GeneratedDocument,
} from '../../types/knowledgeGeneration';

// Mock API client
vi.mock('@/shared/api/instances', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock timers for polling tests
vi.useFakeTimers();

describe('useKnowledgeGeneration', () => {
  let composable: ReturnType<typeof useKnowledgeGeneration>;

  beforeEach(() => {
    composable = useKnowledgeGeneration();
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  // ============================================================
  // Initial State Tests
  // ============================================================

  describe('初始状态', () => {
    it('应该有正确的初始值', () => {
      expect(composable.task.value).toBeNull();
      expect(composable.documents.value).toEqual([]);
      expect(composable.isGenerating.value).toBe(false);
      expect(composable.error.value).toBeNull();
      expect(composable.currentStep.value).toBe(1);
      expect(composable.documentCount.value).toBe(5);
      expect(composable.targetAudience.value).toBe('Beginners');
    });

    it('progress 应该为 0', () => {
      expect(composable.progress.value).toBe(0);
    });

    it('isCompleted 应该为 false', () => {
      expect(composable.isCompleted.value).toBe(false);
    });

    it('isFailed 应该为 false', () => {
      expect(composable.isFailed.value).toBe(false);
    });
  });

  // ============================================================
  // Start Generation Tests
  // ============================================================

  describe('startGeneration', () => {
    const mockRequest: KnowledgeGenerationRequest = {
      topic: '减肥方法',
      documentCount: 5,
      targetAudience: 'Beginners',
    };

    const mockTaskResponse = {
      taskUuid: 'task-123',
    };

    const mockTaskStatus: KnowledgeGenerationTask = {
      taskUuid: 'task-123',
      topic: '减肥方法',
      status: 'GENERATING',
      progress: 10,
      generatedDocuments: [],
      createdAt: Date.now(),
    };

    beforeEach(() => {
      vi.mocked(api.post).mockResolvedValue(mockTaskResponse);
      vi.mocked(api.get).mockResolvedValue(mockTaskStatus);
    });

    it('应该调用 POST API 创建任务', async () => {
      await composable.startGeneration(mockRequest);

      expect(api.post).toHaveBeenCalledWith('/api/ai/generate/knowledge-series', mockRequest);
    });

    it('应该设置 isGenerating 为 true', async () => {
      await composable.startGeneration(mockRequest);

      expect(composable.isGenerating.value).toBe(true);
    });

    it('应该更新 currentStep 到 2', async () => {
      await composable.startGeneration(mockRequest);

      expect(composable.currentStep.value).toBe(2);
    });

    it('应该开始轮询任务状态', async () => {
      await composable.startGeneration(mockRequest);

      // First poll happens immediately
      expect(api.get).toHaveBeenCalledWith('/api/ai/generate/knowledge-series/task-123');

      // Advance timer and check polling continues
      await vi.advanceTimersByTimeAsync(2000);

      expect(api.get).toHaveBeenCalledTimes(2);
    });

    it('应该处理 API 错误', async () => {
      const mockError = {
        response: {
          status: 429,
          data: { message: '配额已用完' },
        },
      };

      vi.mocked(api.post).mockRejectedValue(mockError);

      await expect(composable.startGeneration(mockRequest)).rejects.toThrow();

      expect(composable.isGenerating.value).toBe(false);
      expect(composable.error.value).toBe('今日配额已用完，请明天再试。');
    });
  });

  // ============================================================
  // Polling Tests
  // ============================================================

  describe('pollProgress', () => {
    const mockTask: KnowledgeGenerationTask = {
      taskUuid: 'task-123',
      topic: '减肥方法',
      status: 'GENERATING',
      progress: 50,
      generatedDocuments: [
        {
          uuid: 'doc-1',
          title: '健康减肥基础',
          status: 'COMPLETED',
          excerpt: '了解健康减肥的基本原理...',
          wordCount: 500,
        },
      ],
      estimatedTimeRemaining: 60,
      createdAt: Date.now(),
    };

    it('应该更新任务状态', async () => {
      vi.mocked(api.get).mockResolvedValue(mockTask);

      // Start generation first
      vi.mocked(api.post).mockResolvedValue({ taskUuid: 'task-123' });
      await composable.startGeneration({
        topic: '减肥方法',
        documentCount: 5,
        targetAudience: 'Beginners',
      });

      // Wait for next poll
      await vi.advanceTimersByTimeAsync(2000);

      expect(composable.task.value).toEqual(mockTask);
      expect(composable.progress.value).toBe(50);
    });

    it('应该在任务完成时停止轮询', async () => {
      const completedTask: KnowledgeGenerationTask = {
        ...mockTask,
        status: 'COMPLETED',
        progress: 100,
        completedAt: Date.now(),
      };

      const mockDocuments: GeneratedDocument[] = [
        {
          uuid: 'doc-1',
          title: '健康减肥基础',
          content: '完整内容...',
          wordCount: 500,
          status: 'COMPLETED',
          folderPath: '/AI Generated/减肥方法',
          createdAt: Date.now(),
        },
      ];

      vi.mocked(api.get)
        .mockResolvedValueOnce(mockTask) // First poll
        .mockResolvedValueOnce(completedTask) // Second poll (completed)
        .mockResolvedValueOnce(mockDocuments); // Fetch documents

      vi.mocked(api.post).mockResolvedValue({ taskUuid: 'task-123' });

      await composable.startGeneration({
        topic: '减肥方法',
        documentCount: 5,
        targetAudience: 'Beginners',
      });

      // First poll
      await vi.advanceTimersByTimeAsync(2000);

      // Second poll (should stop polling)
      await vi.advanceTimersByTimeAsync(2000);

      // Should not poll again
      const callCountBefore = vi.mocked(api.get).mock.calls.length;
      await vi.advanceTimersByTimeAsync(2000);
      expect(vi.mocked(api.get).mock.calls.length).toBe(callCountBefore);

      expect(composable.isGenerating.value).toBe(false);
      expect(composable.currentStep.value).toBe(3);
      expect(composable.documents.value).toEqual(mockDocuments);
    });

    it('应该在任务失败时停止轮询', async () => {
      const failedTask: KnowledgeGenerationTask = {
        ...mockTask,
        status: 'FAILED',
        error: '配额不足',
      };

      vi.mocked(api.get).mockResolvedValueOnce(failedTask);
      vi.mocked(api.post).mockResolvedValue({ taskUuid: 'task-123' });

      await composable.startGeneration({
        topic: '减肥方法',
        documentCount: 5,
        targetAudience: 'Beginners',
      });

      await vi.advanceTimersByTimeAsync(2000);

      expect(composable.isGenerating.value).toBe(false);
      expect(composable.error.value).toBe('配额不足');
    });
  });

  // ============================================================
  // Document Management Tests
  // ============================================================

  describe('discardDocument', () => {
    it('应该从数组中移除文档', () => {
      const mockDocuments: GeneratedDocument[] = [
        {
          uuid: 'doc-1',
          title: 'Doc 1',
          content: 'Content',
          wordCount: 100,
          status: 'COMPLETED',
          folderPath: '/path',
          createdAt: Date.now(),
        },
        {
          uuid: 'doc-2',
          title: 'Doc 2',
          content: 'Content',
          wordCount: 200,
          status: 'COMPLETED',
          folderPath: '/path',
          createdAt: Date.now(),
        },
      ];

      composable.documents.value = [...mockDocuments];

      composable.discardDocument('doc-1');

      expect(composable.documents.value).toHaveLength(1);
      expect(composable.documents.value[0].uuid).toBe('doc-2');
    });
  });

  // ============================================================
  // Cancel and Reset Tests
  // ============================================================

  describe('cancelTask', () => {
    it('应该停止轮询并清除状态', async () => {
      vi.mocked(api.post).mockResolvedValue({ taskUuid: 'task-123' });
      vi.mocked(api.get).mockResolvedValue({
        taskUuid: 'task-123',
        topic: 'Test',
        status: 'GENERATING',
        progress: 50,
        generatedDocuments: [],
        createdAt: Date.now(),
      });

      await composable.startGeneration({
        topic: '测试',
        documentCount: 3,
        targetAudience: 'Beginners',
      });

      expect(composable.isGenerating.value).toBe(true);

      composable.cancelTask();

      expect(composable.isGenerating.value).toBe(false);

      // Verify polling stopped
      const callCount = vi.mocked(api.get).mock.calls.length;
      await vi.advanceTimersByTimeAsync(2000);
      expect(vi.mocked(api.get).mock.calls.length).toBe(callCount);
    });
  });

  describe('reset', () => {
    it('应该重置所有状态', async () => {
      vi.mocked(api.post).mockResolvedValue({ taskUuid: 'task-123' });
      vi.mocked(api.get).mockResolvedValue({
        taskUuid: 'task-123',
        topic: 'Test',
        status: 'GENERATING',
        progress: 50,
        generatedDocuments: [],
        createdAt: Date.now(),
      });

      await composable.startGeneration({
        topic: '测试',
        documentCount: 3,
        targetAudience: 'Advanced',
      });

      composable.reset();

      expect(composable.task.value).toBeNull();
      expect(composable.documents.value).toEqual([]);
      expect(composable.isGenerating.value).toBe(false);
      expect(composable.error.value).toBeNull();
      expect(composable.currentStep.value).toBe(1);
      expect(composable.documentCount.value).toBe(5);
      expect(composable.targetAudience.value).toBe('Beginners');
    });
  });

  // ============================================================
  // Error Mapping Tests
  // ============================================================

  describe('错误处理', () => {
    it('应该映射 401 错误', async () => {
      const error = {
        response: { status: 401 },
      };

      vi.mocked(api.post).mockRejectedValue(error);

      await expect(
        composable.startGeneration({
          topic: '测试',
          documentCount: 3,
          targetAudience: 'Beginners',
        }),
      ).rejects.toThrow();

      expect(composable.error.value).toBe('请登录后使用此功能。');
    });

    it('应该映射 429 错误', async () => {
      const error = {
        response: { status: 429 },
      };

      vi.mocked(api.post).mockRejectedValue(error);

      await expect(
        composable.startGeneration({
          topic: '测试',
          documentCount: 3,
          targetAudience: 'Beginners',
        }),
      ).rejects.toThrow();

      expect(composable.error.value).toBe('今日配额已用完，请明天再试。');
    });

    it('应该映射 500 错误', async () => {
      const error = {
        response: { status: 500 },
      };

      vi.mocked(api.post).mockRejectedValue(error);

      await expect(
        composable.startGeneration({
          topic: '测试',
          documentCount: 3,
          targetAudience: 'Beginners',
        }),
      ).rejects.toThrow();

      expect(composable.error.value).toBe('服务暂时不可用，请稍后重试。');
    });
  });
});
