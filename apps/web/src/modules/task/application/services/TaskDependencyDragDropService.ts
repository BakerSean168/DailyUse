/**
 * Task Dependency Drag-Drop Service
 *
 * Handles dependency creation via drag-and-drop operations.
 * Includes validation, user confirmation, and integration with DAG updates.
 *
 * @module TaskDependencyDragDropService
 */

import type { TaskContracts } from '@dailyuse/contracts';
import { taskDependencyApiClient } from '@/modules/task/infrastructure/api/taskApiClient';
import { TaskDependencyValidationService } from './TaskDependencyValidationService';
import { useSnackbar } from '@/shared/composables/useSnackbar';

type TaskTemplateClientDTO = TaskContracts.TaskTemplateClientDTO;
type CreateTaskDependencyRequest = TaskContracts.CreateTaskDependencyRequest;
type TaskDependencyClientDTO = TaskContracts.TaskDependencyClientDTO;
type DependencyType = TaskContracts.DependencyType;

/**
 * Result of dependency creation
 */
export interface DependencyCreationResult {
  success: boolean;
  dependency?: TaskDependencyClientDTO;
  error?: string;
}

/**
 * Service for drag-and-drop dependency creation
 */
export class TaskDependencyDragDropService {
  private validationService = new TaskDependencyValidationService();

  /**
   * 延迟获取 Snackbar（避免在 Pinia 初始化前访问）
   */
  private get snackbar() {
    return useSnackbar();
  }

  /**
   * Create dependency from drag-and-drop operation
   *
   * Workflow:
   * 1. Validate dependency (check for cycles, duplicates, etc.)
   * 2. Create dependency via API
   * 3. Show success/error notification
   * 4. Trigger DAG refresh (handled by caller)
   *
   * @param sourceTask The task that depends on target (dragged task)
   * @param targetTask The task that source depends on (drop target)
   * @param dependencyType Type of dependency (default: FINISH_TO_START)
   * @returns Promise with creation result
   *
   * @example
   * ```typescript
   * const service = new TaskDependencyDragDropService();
   * const result = await service.createDependencyFromDrop(taskA, taskB);
   * if (result.success) {
   *   // Refresh DAG visualization
   *   dagService.refresh();
   * }
   * ```
   */
  async createDependencyFromDrop(
    sourceTask: TaskTemplateClientDTO,
    targetTask: TaskTemplateClientDTO,
    dependencyType: DependencyType = 'FINISH_TO_START' as DependencyType,
  ): Promise<DependencyCreationResult> {
    try {
      // Step 1: Validate dependency
      const validation = await this.validateDependency(sourceTask, targetTask);

      if (!validation.isValid) {
        this.snackbar.showError(`无法创建依赖: ${validation.reason || '验证失败'}`);
        return {
          success: false,
          error: validation.reason,
        };
      }

      // Step 2: Create dependency request
      const request: CreateTaskDependencyRequest = {
        predecessorTaskUuid: targetTask.uuid, // targetTask is the predecessor (must finish first)
        successorTaskUuid: sourceTask.uuid, // sourceTask is the successor (depends on predecessor)
        dependencyType,
        lagDays: 0,
      };

      // Step 3: Call API
      console.log('[DragDropService] Creating dependency:', {
        source: sourceTask.title,
        target: targetTask.title,
        type: dependencyType,
      });

      const dependency = await taskDependencyApiClient.createDependency(sourceTask.uuid, request);

      // Step 4: Show success notification
      this.showSuccessNotification(sourceTask, targetTask);

      return {
        success: true,
        dependency,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建依赖关系失败';

      console.error('[DragDropService] Failed to create dependency:', error);
      this.snackbar.showError(errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Validate dependency creation
   *
   * @param sourceTask Task that will depend on target
   * @param targetTask Task that source will depend on
   * @returns Validation result
   */
  private async validateDependency(
    sourceTask: TaskTemplateClientDTO,
    targetTask: TaskTemplateClientDTO,
  ): Promise<{ isValid: boolean; reason?: string }> {
    try {
      // Use existing validation service
      const validationRequest: TaskContracts.ValidateDependencyRequest = {
        predecessorTaskUuid: targetTask.uuid,
        successorTaskUuid: sourceTask.uuid,
      };

      const validationResponse =
        await taskDependencyApiClient.validateDependency(validationRequest);

      return {
        isValid: validationResponse.isValid,
        reason: validationResponse.errors?.[0] || validationResponse.message,
      };
    } catch (error) {
      console.error('[DragDropService] Validation failed:', error);
      return {
        isValid: false,
        reason: error instanceof Error ? error.message : '验证失败',
      };
    }
  }

  /**
   * Show success notification with dependency details
   *
   * @param sourceTask Source task
   * @param targetTask Target task
   */
  private showSuccessNotification(
    sourceTask: TaskTemplateClientDTO,
    targetTask: TaskTemplateClientDTO,
  ): void {
    const message = `✓ 依赖关系已创建\n"${sourceTask.title}" 现在依赖于 "${targetTask.title}"`;

    this.snackbar.showSuccess(message, 5000);
  }

  /**
   * Quick validation for drop target highlighting
   * This is a faster, client-side-only validation for immediate visual feedback
   *
   * @param sourceTask Source task
   * @param targetTask Target task
   * @returns True if drop is likely valid (not definitive)
   */
  canDropOn(sourceTask: TaskTemplateClientDTO, targetTask: TaskTemplateClientDTO): boolean {
    // Cannot drop on self
    if (sourceTask.uuid === targetTask.uuid) {
      return false;
    }

    // Cannot create dependency if target is already completed
    if (targetTask.status === 'ARCHIVED') {
      return false;
    }

    // Cannot create dependency if source is already completed
    if (sourceTask.status === 'ARCHIVED') {
      return false;
    }

    // For full validation (cycles, duplicates), use validateDependency()
    // This is just for quick visual feedback
    return true;
  }
}
