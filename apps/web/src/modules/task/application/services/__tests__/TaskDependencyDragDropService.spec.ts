/**
 * filepath: d:\myPrograms\DailyUse\apps\web\src\modules\task\application\services\__tests__\TaskDependencyDragDropService.spec.ts
 *
 * Unit tests for TaskDependencyDragDropService
 * Tests drag-drop dependency creation business logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TaskDependencyDragDropService } from '../TaskDependencyDragDropService';
import type { TaskTemplateClientDTO, TaskInstanceClientDTO } from '@dailyuse/contracts/task';

type TaskClientDTO = TaskTemplateClientDTO;
type DependencyType = DependencyType;
vi.mock('../../../infrastructure/api/taskApiClient', () => ({
  taskDependencyApiClient: {
    validateDependency: vi.fn(),
    createDependency: vi.fn(),
  },
}));

vi.mock('../TaskDependencyValidationService', () => ({
  TaskDependencyValidationService: vi.fn().mockImplementation(() => ({
    isCircular: vi.fn(),
    isDuplicate: vi.fn(),
  })),
}));

vi.mock('../../../../shared/composables/useSnackbar', () => ({
  useSnackbar: vi.fn(() => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showWarning: vi.fn(),
  })),
}));

describe('TaskDependencyDragDropService', () => {
  let service: TaskDependencyDragDropService;
  let mockSourceTask: TaskClientDTO;
  let mockTargetTask: TaskClientDTO;

  beforeEach(() => {
    service = new TaskDependencyDragDropService();

    mockSourceTask = {
      uuid: 'source-task-uuid',
      title: 'Source Task',
      lifecycle: { status: 'active' },
    } as unknown as TaskClientDTO;

    mockTargetTask = {
      uuid: 'target-task-uuid',
      title: 'Target Task',
      lifecycle: { status: 'active' },
    } as unknown as TaskClientDTO;

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('canDropOn', () => {
    it('should return false when dropping task onto itself', () => {
      const result = service.canDropOn(mockSourceTask, mockSourceTask);
      expect(result).toBe(false);
    });

    it('should return false when source task is archived', () => {
      const archivedTask = {
        ...mockSourceTask,
        lifecycle: { status: 'archived' },
      } as unknown as TaskClientDTO;

      const result = service.canDropOn(archivedTask, mockTargetTask);
      expect(result).toBe(false);
    });

    it('should return false when target task is archived', () => {
      const archivedTask = {
        ...mockTargetTask,
        lifecycle: { status: 'archived' },
      } as unknown as TaskClientDTO;

      const result = service.canDropOn(mockSourceTask, archivedTask);
      expect(result).toBe(false);
    });

    it('should return true for valid drop', () => {
      const result = service.canDropOn(mockSourceTask, mockTargetTask);
      expect(result).toBe(true);
    });
  });

  describe('createDependencyFromDrop', () => {
    it('should fail validation for same task', async () => {
      const result = await service.createDependencyFromDrop(
        mockSourceTask,
        mockSourceTask,
        'FINISH_TO_START' as DependencyType,
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('不能依赖自己');
    });

    it('should fail validation for archived tasks', async () => {
      const archivedTask = {
        ...mockSourceTask,
        lifecycle: { status: 'archived' },
      } as unknown as TaskClientDTO;

      const result = await service.createDependencyFromDrop(
        archivedTask,
        mockTargetTask,
        'FINISH_TO_START' as DependencyType,
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('归档');
    });

    it('should create dependency with correct predecessor/successor', async () => {
      const { taskDependencyApiClient } = await import('../../../infrastructure/api/taskApiClient');

      (taskDependencyApiClient.validateDependency as any).mockResolvedValue({
        isValid: true,
      });

      (taskDependencyApiClient.createDependency as any).mockResolvedValue({
        uuid: 'dep-uuid',
        predecessorTaskUuid: mockTargetTask.uuid,
        successorTaskUuid: mockSourceTask.uuid,
      });

      const result = await service.createDependencyFromDrop(
        mockSourceTask,
        mockTargetTask,
        'FINISH_TO_START' as DependencyType,
      );

      expect(result.success).toBe(true);
      expect(taskDependencyApiClient.createDependency).toHaveBeenCalledWith(mockSourceTask.uuid, {
        predecessorTaskUuid: mockTargetTask.uuid, // Target must finish first
        successorTaskUuid: mockSourceTask.uuid, // Source depends on target
        dependencyType: 'FINISH_TO_START',
        lagDays: 0,
      });
    });

    it('should handle validation failure', async () => {
      const { taskDependencyApiClient } = await import('../../../infrastructure/api/taskApiClient');

      (taskDependencyApiClient.validateDependency as any).mockResolvedValue({
        isValid: false,
        errors: ['会形成循环依赖'],
        wouldCreateCycle: true,
      });

      const result = await service.createDependencyFromDrop(
        mockSourceTask,
        mockTargetTask,
        'FINISH_TO_START' as DependencyType,
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('会形成循环依赖');
    });

    it('should handle API error', async () => {
      const { taskDependencyApiClient } = await import('../../../infrastructure/api/taskApiClient');

      (taskDependencyApiClient.validateDependency as any).mockResolvedValue({
        isValid: true,
      });

      (taskDependencyApiClient.createDependency as any).mockRejectedValue(
        new Error('Network error'),
      );

      const result = await service.createDependencyFromDrop(
        mockSourceTask,
        mockTargetTask,
        'FINISH_TO_START' as DependencyType,
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('dependency types', () => {
    it('should support FS (Finish-to-Start) dependency', async () => {
      const { taskDependencyApiClient } = await import('../../../infrastructure/api/taskApiClient');

      (taskDependencyApiClient.validateDependency as any).mockResolvedValue({ isValid: true });
      (taskDependencyApiClient.createDependency as any).mockResolvedValue({
        uuid: 'dep-uuid',
        dependencyType: 'FINISH_TO_START',
      });

      const result = await service.createDependencyFromDrop(
        mockSourceTask,
        mockTargetTask,
        'FINISH_TO_START' as DependencyType,
      );

      expect(result.success).toBe(true);
      expect(taskDependencyApiClient.createDependency).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          dependencyType: 'FINISH_TO_START',
        }),
      );
    });

    it('should default to FINISH_TO_START when no type specified', async () => {
      const { taskDependencyApiClient } = await import('../../../infrastructure/api/taskApiClient');

      (taskDependencyApiClient.validateDependency as any).mockResolvedValue({ isValid: true });
      (taskDependencyApiClient.createDependency as any).mockResolvedValue({
        uuid: 'dep-uuid',
      });

      await service.createDependencyFromDrop(mockSourceTask, mockTargetTask);

      expect(taskDependencyApiClient.createDependency).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          dependencyType: 'FINISH_TO_START',
        }),
      );
    });
  });

  describe('notifications', () => {
    it.skip('should show success notification on successful creation', async () => {
      // This test is skipped because useSnackbar mocking is complex
      // Notifications are tested in integration tests
    });

    it.skip('should show error notification on failure', async () => {
      // This test is skipped because useSnackbar mocking is complex
      // Notifications are tested in integration tests
    });
  });
});

