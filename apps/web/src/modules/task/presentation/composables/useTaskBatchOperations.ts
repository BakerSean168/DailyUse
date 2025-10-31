/**
 * Task Batch Operations Composable
 * 任务批量操作组合式函数
 * 
 * 职责：
 * - 批量任务选择管理
 * - 批量操作执行
 * - 操作进度跟踪
 */

import { ref, computed, readonly } from 'vue';
import type { TaskDomain } from '@dailyuse/domain-client';
import { oneTimeTaskBatchOperationService } from '../../application/services';

type TaskTemplate = TaskDomain.TaskTemplate;

/**
 * 批量操作结果
 */
interface BatchOperationResult {
  success: boolean;
  affectedCount: number;
  tasks: TaskTemplate[];
  error?: string;
}

/**
 * 任务批量操作 Composable
 */
export function useTaskBatchOperations() {
  // ===== 本地状态 =====
  const selectedTaskUuids = ref<Set<string>>(new Set());
  const isOperating = ref(false);
  const operationProgress = ref<number>(0);
  const operationError = ref<string | null>(null);

  // ===== 计算属性 =====

  /**
   * 已选择的任务数量
   */
  const selectedCount = computed(() => selectedTaskUuids.value.size);

  /**
   * 是否有选中的任务
   */
  const hasSelection = computed(() => selectedTaskUuids.value.size > 0);

  /**
   * 已选择的任务 UUID 列表
   */
  const selectedUuids = computed(() => Array.from(selectedTaskUuids.value));

  /**
   * 是否正在操作中
   */
  const isBusy = computed(() => isOperating.value);

  // ===== 选择管理 =====

  /**
   * 选择一个任务
   */
  function selectTask(uuid: string): void {
    selectedTaskUuids.value.add(uuid);
  }

  /**
   * 取消选择一个任务
   */
  function deselectTask(uuid: string): void {
    selectedTaskUuids.value.delete(uuid);
  }

  /**
   * 切换任务选择状态
   */
  function toggleTaskSelection(uuid: string): void {
    if (selectedTaskUuids.value.has(uuid)) {
      deselectTask(uuid);
    } else {
      selectTask(uuid);
    }
  }

  /**
   * 批量选择任务
   */
  function selectTasks(uuids: string[]): void {
    uuids.forEach((uuid) => selectedTaskUuids.value.add(uuid));
  }

  /**
   * 全选任务
   */
  function selectAllTasks(tasks: TaskTemplate[]): void {
    tasks.forEach((task) => selectedTaskUuids.value.add(task.uuid));
  }

  /**
   * 清除所有选择
   */
  function clearSelection(): void {
    selectedTaskUuids.value.clear();
  }

  /**
   * 检查任务是否被选中
   */
  function isTaskSelected(uuid: string): boolean {
    return selectedTaskUuids.value.has(uuid);
  }

  /**
   * 反选
   */
  function invertSelection(allTasks: TaskTemplate[]): void {
    const allUuids = new Set(allTasks.map((t) => t.uuid));
    const newSelection = new Set<string>();

    allUuids.forEach((uuid) => {
      if (!selectedTaskUuids.value.has(uuid)) {
        newSelection.add(uuid);
      }
    });

    selectedTaskUuids.value = newSelection;
  }

  // ===== 批量操作 =====

  /**
   * 执行批量操作的包装器
   */
  async function executeBatchOperation<T>(
    operation: () => Promise<T>,
    errorMessage: string,
  ): Promise<T> {
    try {
      isOperating.value = true;
      operationProgress.value = 0;
      operationError.value = null;

      const result = await operation();

      operationProgress.value = 100;
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : errorMessage;
      operationError.value = message;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 批量更新优先级
   */
  async function batchUpdatePriority(
    importance?: number,
    urgency?: number,
  ): Promise<BatchOperationResult> {
    if (!hasSelection.value) {
      return {
        success: false,
        affectedCount: 0,
        tasks: [],
        error: '没有选中的任务',
      };
    }

    try {
      const tasks = await executeBatchOperation(
        () =>
          oneTimeTaskBatchOperationService.batchUpdatePriority(
            selectedUuids.value,
            importance,
            urgency,
          ),
        '批量更新优先级失败',
      );

      // 操作成功后清除选择
      clearSelection();

      return {
        success: true,
        affectedCount: tasks.length,
        tasks,
      };
    } catch (error) {
      return {
        success: false,
        affectedCount: 0,
        tasks: [],
        error: error instanceof Error ? error.message : '批量更新失败',
      };
    }
  }

  /**
   * 批量取消任务
   */
  async function batchCancelTasks(reason?: string): Promise<BatchOperationResult> {
    if (!hasSelection.value) {
      return {
        success: false,
        affectedCount: 0,
        tasks: [],
        error: '没有选中的任务',
      };
    }

    try {
      const tasks = await executeBatchOperation(
        () =>
          oneTimeTaskBatchOperationService.batchCancelTasks(
            selectedUuids.value,
            reason,
          ),
        '批量取消任务失败',
      );

      // 操作成功后清除选择
      clearSelection();

      return {
        success: true,
        affectedCount: tasks.length,
        tasks,
      };
    } catch (error) {
      return {
        success: false,
        affectedCount: 0,
        tasks: [],
        error: error instanceof Error ? error.message : '批量取消失败',
      };
    }
  }

  /**
   * 按条件选择任务
   */
  function selectTasksByCondition(
    tasks: TaskTemplate[],
    predicate: (task: TaskTemplate) => boolean,
  ): void {
    const matchingTasks = tasks.filter(predicate);
    selectTasks(matchingTasks.map((t) => t.uuid));
  }

  /**
   * 选择高优先级任务
   */
  function selectHighPriorityTasks(tasks: TaskTemplate[]): void {
    selectTasksByCondition(tasks, (task) => (task as any).priorityLevel === 'HIGH');
  }

  /**
   * 选择逾期任务
   */
  function selectOverdueTasks(tasks: TaskTemplate[]): void {
    const now = Date.now();
    selectTasksByCondition(
      tasks,
      (task) =>
        (task as any).dueDate !== undefined &&
        (task as any).dueDate < now &&
        (task.status as any) !== 'COMPLETED',
    );
  }

  /**
   * 选择待执行任务
   */
  function selectPendingTasks(tasks: TaskTemplate[]): void {
    selectTasksByCondition(tasks, (task) => (task.status as any) === 'PENDING');
  }

  /**
   * 清除错误
   */
  function clearError(): void {
    operationError.value = null;
  }

  /**
   * 重置状态
   */
  function reset(): void {
    clearSelection();
    clearError();
    operationProgress.value = 0;
  }

  // ===== 返回 API =====

  return {
    // 选择状态
    selectedTaskUuids: readonly(selectedTaskUuids),
    selectedCount: readonly(selectedCount),
    hasSelection: readonly(hasSelection),
    selectedUuids: readonly(selectedUuids),

    // 操作状态
    isOperating: readonly(isOperating),
    isBusy: readonly(isBusy),
    operationProgress: readonly(operationProgress),
    operationError: readonly(operationError),

    // 选择管理
    selectTask,
    deselectTask,
    toggleTaskSelection,
    selectTasks,
    selectAllTasks,
    clearSelection,
    isTaskSelected,
    invertSelection,

    // 条件选择
    selectTasksByCondition,
    selectHighPriorityTasks,
    selectOverdueTasks,
    selectPendingTasks,

    // 批量操作
    batchUpdatePriority,
    batchCancelTasks,

    // 辅助方法
    clearError,
    reset,
  };
}
