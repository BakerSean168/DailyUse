/**
 * filepath: d:\myPrograms\DailyUse\apps\web\src\shared\composables\__tests__\useDragAndDrop.spec.ts
 *
 * Unit tests for useDragAndDrop composable
 * Tests drag-and-drop state management and callbacks
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { useDragAndDrop } from '../useDragAndDrop';
import type { TaskTemplateClientDTO, TaskInstanceClientDTO } from '@dailyuse/contracts/task';

type TaskClientDTO = TaskTemplateClientDTO;

describe('useDragAndDrop', () => {
  let mockTask1: TaskClientDTO;
  let mockTask2: TaskClientDTO;

  beforeEach(() => {
    mockTask1 = {
      uuid: 'task-1',
      title: 'Task 1',
      description: 'Description 1',
      importance: 5,
      urgency: 5,
      lifecycle: {
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    } as unknown as TaskClientDTO;

    mockTask2 = {
      uuid: 'task-2',
      title: 'Task 2',
      description: 'Description 2',
      importance: 3,
      urgency: 3,
      lifecycle: {
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    } as unknown as TaskClientDTO;
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { isDragging, draggedTask, dropTarget, isValidDrop, dragOperation } = useDragAndDrop();

      expect(isDragging.value).toBe(false);
      expect(draggedTask.value).toBeNull();
      expect(dropTarget.value).toBeNull();
      expect(isValidDrop.value).toBe(false);
      expect(dragOperation.value).toBeNull();
    });

    it('should accept configuration options', () => {
      const validateDrop = vi.fn(() => true);
      const onDragStart = vi.fn();

      useDragAndDrop({
        mode: 'dependency',
        validateDrop,
        onDragStart,
      });

      // Should not throw
      expect(validateDrop).not.toHaveBeenCalled(); // Not called until drag starts
      expect(onDragStart).not.toHaveBeenCalled();
    });
  });

  describe('handleDragStart', () => {
    it('should set dragging state when drag starts', () => {
      const { isDragging, draggedTask, handleDragStart } = useDragAndDrop();

      handleDragStart(mockTask1);

      expect(isDragging.value).toBe(true);
      expect(draggedTask.value).toEqual(mockTask1);
    });

    it('should call onDragStart callback', () => {
      const onDragStart = vi.fn();
      const { handleDragStart } = useDragAndDrop({ onDragStart });

      handleDragStart(mockTask1);

      expect(onDragStart).toHaveBeenCalledWith(mockTask1);
      expect(onDragStart).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleDragOver', () => {
    it('should set dropTarget when dragging over', () => {
      const { dropTarget, handleDragStart, handleDragOver } = useDragAndDrop();

      handleDragStart(mockTask1);
      handleDragOver(mockTask2);

      expect(dropTarget.value).toEqual(mockTask2);
    });

    it('should validate drop when validateDrop function provided', () => {
      const validateDrop = vi.fn(() => true);
      const { isValidDrop, handleDragStart, handleDragOver } = useDragAndDrop({
        validateDrop,
      });

      handleDragStart(mockTask1);
      handleDragOver(mockTask2);

      expect(validateDrop).toHaveBeenCalledWith(mockTask1, mockTask2);
      expect(isValidDrop.value).toBe(true);
    });

    it('should set isValidDrop to false when validation fails', () => {
      const validateDrop = vi.fn(() => false);
      const { isValidDrop, handleDragStart, handleDragOver } = useDragAndDrop({
        validateDrop,
      });

      handleDragStart(mockTask1);
      handleDragOver(mockTask2);

      expect(isValidDrop.value).toBe(false);
    });

    it('should prevent dragging onto self', () => {
      const validateDrop = vi.fn(() => true);
      const { isValidDrop, handleDragStart, handleDragOver } = useDragAndDrop({
        validateDrop,
      });

      handleDragStart(mockTask1);
      handleDragOver(mockTask1); // Same task

      expect(isValidDrop.value).toBe(false);
      expect(validateDrop).not.toHaveBeenCalled(); // Validation skipped
    });
  });

  describe('handleDrop - dependency mode', () => {
    it('should call onDependencyCreate when dropping in dependency mode', async () => {
      const onDependencyCreate = vi.fn().mockResolvedValue(undefined);
      const { handleDragStart, handleDragOver, handleDrop } = useDragAndDrop({
        mode: 'dependency',
        onDependencyCreate,
      });

      handleDragStart(mockTask1);
      handleDragOver(mockTask2);
      await handleDrop(mockTask2);

      expect(onDependencyCreate).toHaveBeenCalledWith(mockTask1, mockTask2);
      expect(onDependencyCreate).toHaveBeenCalledTimes(1);
    });

    it('should set dragOperation to "dependency"', () => {
      const { dragOperation, handleDragStart, handleDragOver } = useDragAndDrop({
        mode: 'dependency',
      });

      handleDragStart(mockTask1);
      handleDragOver(mockTask2);

      expect(dragOperation.value).toBe('dependency');
    });

    it('should not call onReorder in dependency mode', async () => {
      const onReorder = vi.fn();
      const onDependencyCreate = vi.fn().mockResolvedValue(undefined);
      const { handleDragStart, handleDragOver, handleDrop } = useDragAndDrop({
        mode: 'dependency',
        onReorder,
        onDependencyCreate,
      });

      handleDragStart(mockTask1);
      handleDragOver(mockTask2);
      await handleDrop(mockTask2, 1);

      expect(onReorder).not.toHaveBeenCalled();
      expect(onDependencyCreate).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleDrop - reorder mode', () => {
    it('should call onReorder when dropping in reorder mode', async () => {
      const onReorder = vi.fn().mockResolvedValue(undefined);
      const { handleDragStart, handleDrop } = useDragAndDrop({
        mode: 'reorder',
        onReorder,
      });

      handleDragStart(mockTask1);
      await handleDrop(mockTask2, 2);

      expect(onReorder).toHaveBeenCalledWith(mockTask1, 2);
      expect(onReorder).toHaveBeenCalledTimes(1);
    });

    it('should set dragOperation to "reorder"', () => {
      const { dragOperation, handleDragStart, handleDragOver } = useDragAndDrop({
        mode: 'reorder',
      });

      handleDragStart(mockTask1);
      handleDragOver(mockTask2);

      expect(dragOperation.value).toBe('reorder');
    });
  });

  describe('handleDrop - both mode', () => {
    it('should default to dependency when no newIndex provided', async () => {
      const onDependencyCreate = vi.fn().mockResolvedValue(undefined);
      const onReorder = vi.fn();
      const { handleDragStart, handleDragOver, handleDrop } = useDragAndDrop({
        mode: 'both',
        onDependencyCreate,
        onReorder,
      });

      handleDragStart(mockTask1);
      handleDragOver(mockTask2);
      await handleDrop(mockTask2);

      expect(onDependencyCreate).toHaveBeenCalledTimes(1);
      expect(onReorder).not.toHaveBeenCalled();
    });

    it('should call reorder when newIndex provided', async () => {
      const onDependencyCreate = vi.fn();
      const onReorder = vi.fn().mockResolvedValue(undefined);
      const { handleDragStart, handleDrop } = useDragAndDrop({
        mode: 'both',
        onDependencyCreate,
        onReorder,
      });

      handleDragStart(mockTask1);
      await handleDrop(mockTask2, 3);

      expect(onReorder).toHaveBeenCalledTimes(1);
      expect(onDependencyCreate).not.toHaveBeenCalled();
    });
  });

  describe('handleDragEnd', () => {
    it('should reset state when drag ends', () => {
      const {
        isDragging,
        draggedTask,
        dropTarget,
        isValidDrop,
        dragOperation,
        handleDragStart,
        handleDragOver,
        handleDragEnd,
      } = useDragAndDrop();

      handleDragStart(mockTask1);
      handleDragOver(mockTask2);
      handleDragEnd();

      expect(isDragging.value).toBe(false);
      expect(draggedTask.value).toBeNull();
      expect(dropTarget.value).toBeNull();
      expect(isValidDrop.value).toBe(false);
      expect(dragOperation.value).toBeNull();
    });

    it('should call onDragEnd callback', () => {
      const onDragEnd = vi.fn();
      const { handleDragStart, handleDragEnd } = useDragAndDrop({ onDragEnd });

      handleDragStart(mockTask1);
      handleDragEnd();

      expect(onDragEnd).toHaveBeenCalledTimes(1);
    });
  });

  describe('validation edge cases', () => {
    it('should handle missing validateDrop function', () => {
      const { isValidDrop, handleDragStart, handleDragOver } = useDragAndDrop();

      handleDragStart(mockTask1);
      handleDragOver(mockTask2);

      // Should default to true when no validation function
      expect(isValidDrop.value).toBe(true);
    });

    it('should handle validateDrop throwing error', () => {
      const validateDrop = vi.fn(() => {
        throw new Error('Validation error');
      });
      const { isValidDrop, handleDragStart, handleDragOver } = useDragAndDrop({
        validateDrop,
      });

      handleDragStart(mockTask1);

      // Should not throw, should set isValidDrop to false
      expect(() => handleDragOver(mockTask2)).not.toThrow();
      expect(isValidDrop.value).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle onDependencyCreate error gracefully', async () => {
      const onDependencyCreate = vi.fn().mockRejectedValue(new Error('Create failed'));
      const { handleDragStart, handleDragOver, handleDrop } = useDragAndDrop({
        mode: 'dependency',
        onDependencyCreate,
      });

      handleDragStart(mockTask1);
      handleDragOver(mockTask2);

      // Should not throw
      await expect(handleDrop(mockTask2)).resolves.not.toThrow();
    });

    it('should handle onReorder error gracefully', async () => {
      const onReorder = vi.fn().mockRejectedValue(new Error('Reorder failed'));
      const { handleDragStart, handleDrop } = useDragAndDrop({
        mode: 'reorder',
        onReorder,
      });

      handleDragStart(mockTask1);

      // Should not throw
      await expect(handleDrop(mockTask2, 1)).resolves.not.toThrow();
    });
  });
});

