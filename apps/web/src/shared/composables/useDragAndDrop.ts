/**
 * useDragAndDrop Composable
 *
 * Provides reusable drag-and-drop logic for task management.
 * Supports two modes:
 * 1. Reordering: Drag tasks to change their order
 * 2. Dependency Creation: Drag task A onto task B to create dependency
 *
 * @module useDragAndDrop
 */

import { ref, computed, type Ref } from 'vue';
import type { TaskTemplateClientDTO } from '@dailyuse/contracts/task';

/**
 * Drag operation type
 */
export type DragOperation = 'reorder' | 'dependency' | null;

/**
 * Drag mode configuration
 */
export type DragMode = 'reorder' | 'dependency' | 'both';

/**
 * Drag options
 */
export interface DragOptions {
  /**
   * Enable drag operations (default: true)
   */
  enabled?: boolean;

  /**
   * Drag mode (default: 'both')
   * - 'reorder': Only allow reordering
   * - 'dependency': Only allow dependency creation
   * - 'both': Allow both operations
   */
  mode?: DragMode;

  /**
   * Custom validation function for drop operations
   * Returns true if drop is valid, false otherwise
   */
  validateDrop?: (source: TaskTemplateClientDTO, target: TaskTemplateClientDTO) => boolean;

  /**
   * Callback when drag starts
   */
  onDragStart?: (task: TaskTemplateClientDTO) => void;

  /**
   * Callback when drag ends (regardless of success/failure)
   */
  onDragEnd?: () => void;

  /**
   * Callback when task is reordered
   * @param task The task being moved
   * @param newIndex The new index in the list
   */
  onReorder?: (task: TaskTemplateClientDTO, newIndex: number) => Promise<void>;

  /**
   * Callback when dependency is created via drag-drop
   * @param source The task that depends on target (dragged task)
   * @param target The task that source depends on (drop target)
   */
  onDependencyCreate?: (
    source: TaskTemplateClientDTO,
    target: TaskTemplateClientDTO,
  ) => Promise<void>;
}

/**
 * Return type of useDragAndDrop
 */
export interface UseDragAndDropReturn {
  // State
  isDragging: Ref<boolean>;
  draggedTask: Ref<TaskTemplateClientDTO | null>;
  dropTarget: Ref<TaskTemplateClientDTO | null>;
  dragOperation: Ref<DragOperation>;
  isValidDrop: Ref<boolean>;

  // Methods
  handleDragStart: (task: TaskTemplateClientDTO) => void;
  handleDragOver: (target: TaskTemplateClientDTO | null) => void;
  handleDrop: (target: TaskTemplateClientDTO | null, newIndex?: number) => Promise<void>;
  handleDragEnd: () => void;
}

/**
 * Composable for drag-and-drop functionality
 *
 * @param options Drag options
 * @returns Drag state and handlers
 *
 * @example
 * ```typescript
 * const { isDragging, handleDragStart, handleDrop } = useDragAndDrop({
 *   mode: 'both',
 *   onDependencyCreate: async (source, target) => {
 *     await taskService.createDependency(source.uuid, target.uuid);
 *   },
 *   onReorder: async (task, newIndex) => {
 *     await taskService.updateTaskOrder(task.uuid, newIndex);
 *   }
 * });
 * ```
 */
export function useDragAndDrop(options: DragOptions = {}): UseDragAndDropReturn {
  const {
    enabled = true,
    mode = 'both',
    validateDrop,
    onDragStart,
    onDragEnd,
    onReorder,
    onDependencyCreate,
  } = options;

  // ===== State =====

  /**
   * Whether a drag operation is currently in progress
   */
  const isDragging = ref(false);

  /**
   * The task currently being dragged
   */
  const draggedTask = ref<TaskTemplateClientDTO | null>(null);

  /**
   * The current drop target (task being hovered over)
   */
  const dropTarget = ref<TaskTemplateClientDTO | null>(null);

  /**
   * The type of operation being performed
   */
  const dragOperation = ref<DragOperation>(null);

  // ===== Computed =====

  /**
   * Whether the current drop target is valid
   */
  const isValidDrop = computed(() => {
    if (!draggedTask.value || !dropTarget.value) return false;

    // Cannot drop on self
    if (draggedTask.value.uuid === dropTarget.value.uuid) {
      return false;
    }

    // Custom validation
    if (validateDrop) {
      return validateDrop(draggedTask.value, dropTarget.value);
    }

    return true;
  });

  // ===== Methods =====

  /**
   * Handle drag start event
   *
   * @param task The task being dragged
   */
  const handleDragStart = (task: TaskTemplateClientDTO) => {
    if (!enabled) return;

    isDragging.value = true;
    draggedTask.value = task;

    console.log('[DragAndDrop] Drag started:', task.title);

    // Invoke callback
    onDragStart?.(task);
  };

  /**
   * Handle drag over event
   *
   * @param target The task being hovered over (or null if over empty space)
   */
  const handleDragOver = (target: TaskTemplateClientDTO | null) => {
    if (!isDragging.value) return;

    dropTarget.value = target;

    // Determine operation type based on drop target
    if (target && mode !== 'reorder') {
      // Hovering over another task → dependency creation
      dragOperation.value = 'dependency';
    } else if (!target && mode !== 'dependency') {
      // Hovering over empty space → reordering
      dragOperation.value = 'reorder';
    } else {
      dragOperation.value = null;
    }
  };

  /**
   * Handle drop event
   *
   * @param target The task where the dragged task was dropped (or null if dropped in empty space)
   * @param newIndex The new index for reordering (only used for reorder operations)
   */
  const handleDrop = async (target: TaskTemplateClientDTO | null, newIndex?: number) => {
    if (!draggedTask.value) {
      console.warn('[DragAndDrop] Drop called but no task is being dragged');
      return;
    }

    try {
      if (dragOperation.value === 'dependency' && target) {
        // Dependency creation
        if (!isValidDrop.value) {
          console.warn('[DragAndDrop] Invalid drop, cannot create dependency');
          return;
        }

        console.log('[DragAndDrop] Creating dependency:', {
          source: draggedTask.value.title,
          target: target.title,
        });

        await onDependencyCreate?.(draggedTask.value, target);
      } else if (dragOperation.value === 'reorder' && newIndex !== undefined) {
        // Reordering
        console.log('[DragAndDrop] Reordering task:', {
          task: draggedTask.value.title,
          newIndex,
        });

        await onReorder?.(draggedTask.value, newIndex);
      }
    } catch (error) {
      console.error('[DragAndDrop] Drop operation failed:', error);
      throw error;
    } finally {
      handleDragEnd();
    }
  };

  /**
   * Handle drag end event
   * Clears all drag state
   */
  const handleDragEnd = () => {
    console.log('[DragAndDrop] Drag ended');

    isDragging.value = false;
    draggedTask.value = null;
    dropTarget.value = null;
    dragOperation.value = null;

    // Invoke callback
    onDragEnd?.();
  };

  // ===== Return =====

  return {
    // State
    isDragging,
    draggedTask,
    dropTarget,
    dragOperation,
    isValidDrop,

    // Methods
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  };
}
