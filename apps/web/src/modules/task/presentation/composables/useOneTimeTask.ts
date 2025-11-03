/**
 * One-Time Task Composable
 * 一次性任务相关的组合式函数
 * 
 * 职责：
 * - 提供响应式的任务状态
 * - 封装任务生命周期操作
 * - 封装任务查询操作
 * - 封装目标关联操作
 * - 提供 UI 友好的错误处理
 */

import { ref, computed, readonly } from 'vue';
import type { TaskContracts } from '@dailyuse/contracts';
import { TaskTemplate, TaskInstance, TaskStatistics } from '@dailyuse/domain-client';
import {
  oneTimeTaskLifecycleService,
  oneTimeTaskQueryService,
  oneTimeTaskGoalLinkService,
} from '../../application/services';
import { useTaskStore } from '../stores/taskStore';

type CreateOneTimeTaskRequest = TaskContracts.CreateOneTimeTaskRequest;
type TaskFiltersRequest = TaskContracts.TaskFiltersRequest;

/**
 * 一次性任务管理 Composable
 */
export function useOneTimeTask() {
  // ===== 服务和存储 =====
  const taskStore = useTaskStore();

  // ===== 本地状态 =====
  const isOperating = ref(false);
  const operationError = ref<string | null>(null);

  // ===== 计算属性 - 数据访问 =====

  /**
   * 所有一次性任务
   */
  const oneTimeTasks = computed(() =>
    taskStore.getAllTaskTemplates.filter((t) => t.taskType === 'ONE_TIME'),
  );

  /**
   * 待执行的任务
   */
  const pendingTasks = computed(() =>
    oneTimeTasks.value.filter((t) => (t.status as any) === 'PENDING'),
  );

  /**
   * 进行中的任务
   */
  const inProgressTasks = computed(() =>
    oneTimeTasks.value.filter((t) => (t.status as any) === 'IN_PROGRESS'),
  );

  /**
   * 已完成的任务
   */
  const completedTasks = computed(() =>
    oneTimeTasks.value.filter((t) => (t.status as any) === 'COMPLETED'),
  );

  /**
   * 被阻塞的任务
   */
  const blockedTasks = computed(() =>
    oneTimeTasks.value.filter((t) => (t.status as any) === 'BLOCKED'),
  );

  /**
   * 已取消的任务
   */
  const canceledTasks = computed(() =>
    oneTimeTasks.value.filter((t) => (t.status as any) === 'CANCELED'),
  );

  /**
   * 按目标分组的任务
   */
  const tasksByGoal = computed(() => (goalUuid: string) => {
    return oneTimeTasks.value.filter(
      (t) => t.goalBinding && t.goalBinding.goalUuid === goalUuid,
    );
  });

  /**
   * 按关键结果分组的任务
   */
  const tasksByKeyResult = computed(() => (keyResultUuid: string) => {
    return oneTimeTasks.value.filter(
      (t) => t.goalBinding && t.goalBinding.keyResultUuid === keyResultUuid,
    );
  });

  /**
   * 按优先级分组的任务
   */
  const tasksByPriority = computed(() => {
    const grouped = {
      HIGH: [] as TaskTemplate[],
      MEDIUM: [] as TaskTemplate[],
      LOW: [] as TaskTemplate[],
    };

    oneTimeTasks.value.forEach((task) => {
      const priorityLevel = (task as any).priorityLevel;
      if (priorityLevel && grouped[priorityLevel as keyof typeof grouped]) {
        grouped[priorityLevel as keyof typeof grouped].push(task);
      }
    });

    return grouped;
  });

  /**
   * UI 状态
   */
  const isLoading = computed(() => taskStore.isLoading || isOperating.value);
  const error = computed(() => taskStore.error || operationError.value);

  // ===== 辅助函数 =====

  /**
   * 清除错误
   */
  function clearError() {
    operationError.value = null;
    // taskStore doesn't have clearError method - error is cleared via store actions
  }

  /**
   * 执行操作的包装器
   */
  async function executeOperation<T>(
    operation: () => Promise<T>,
    errorMessage: string,
  ): Promise<T> {
    try {
      isOperating.value = true;
      operationError.value = null;
      return await operation();
    } catch (error) {
      const message = error instanceof Error ? error.message : errorMessage;
      operationError.value = message;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  // ===== 生命周期操作 =====

  /**
   * 创建一次性任务
   */
  async function createOneTimeTask(
    request: CreateOneTimeTaskRequest,
  ): Promise<TaskTemplate> {
    return executeOperation(
      () => oneTimeTaskLifecycleService.createOneTimeTask(request),
      '创建任务失败',
    );
  }

  /**
   * 创建子任务
   */
  async function createSubtask(
    parentUuid: string,
    request: CreateOneTimeTaskRequest,
  ): Promise<TaskTemplate> {
    return executeOperation(
      () => oneTimeTaskLifecycleService.createSubtask(parentUuid, request),
      '创建子任务失败',
    );
  }

  /**
   * 开始任务
   */
  async function startTask(uuid: string): Promise<TaskTemplate> {
    return executeOperation(
      () => oneTimeTaskLifecycleService.startTask(uuid),
      '开始任务失败',
    );
  }

  /**
   * 完成任务
   */
  async function completeTask(uuid: string): Promise<TaskTemplate> {
    return executeOperation(
      () => oneTimeTaskLifecycleService.completeTask(uuid),
      '完成任务失败',
    );
  }

  /**
   * 阻塞任务
   */
  async function blockTask(uuid: string, reason?: string): Promise<TaskTemplate> {
    return executeOperation(
      () => oneTimeTaskLifecycleService.blockTask(uuid, reason),
      '阻塞任务失败',
    );
  }

  /**
   * 解除阻塞
   */
  async function unblockTask(uuid: string): Promise<TaskTemplate> {
    return executeOperation(
      () => oneTimeTaskLifecycleService.unblockTask(uuid),
      '解除阻塞失败',
    );
  }

  /**
   * 取消任务
   */
  async function cancelTask(uuid: string, reason?: string): Promise<TaskTemplate> {
    return executeOperation(
      () => oneTimeTaskLifecycleService.cancelTask(uuid, reason),
      '取消任务失败',
    );
  }

  // ===== 查询操作 =====

  /**
   * 获取一次性任务列表（支持过滤）
   */
  async function fetchOneTimeTasks(
    filters?: TaskFiltersRequest,
  ): Promise<TaskTemplate[]> {
    return executeOperation(
      () => oneTimeTaskQueryService.getOneTimeTasks(filters),
      '获取任务列表失败',
    );
  }

  /**
   * 获取今日任务
   */
  async function fetchTodayTasks(): Promise<TaskTemplate[]> {
    return executeOperation(
      () => oneTimeTaskQueryService.getTodayTasks(),
      '获取今日任务失败',
    );
  }

  /**
   * 获取逾期任务
   */
  async function fetchOverdueTasks(): Promise<TaskTemplate[]> {
    return executeOperation(
      () => oneTimeTaskQueryService.getOverdueTasks(),
      '获取逾期任务失败',
    );
  }

  /**
   * 获取即将到期的任务
   */
  async function fetchUpcomingTasks(days: number = 7): Promise<TaskTemplate[]> {
    return executeOperation(
      () => oneTimeTaskQueryService.getUpcomingTasks(days),
      '获取即将到期任务失败',
    );
  }

  /**
   * 按优先级获取任务
   */
  async function fetchTasksByPriority(limit?: number): Promise<TaskTemplate[]> {
    return executeOperation(
      () => oneTimeTaskQueryService.getTasksByPriority(limit),
      '获取高优先级任务失败',
    );
  }

  /**
   * 获取被阻塞的任务
   */
  async function fetchBlockedTasks(): Promise<TaskTemplate[]> {
    return executeOperation(
      () => oneTimeTaskQueryService.getBlockedTasks(),
      '获取被阻塞任务失败',
    );
  }

  /**
   * 按日期范围获取任务
   */
  async function fetchTasksByDateRange(
    startDate: number,
    endDate: number,
  ): Promise<TaskTemplate[]> {
    return executeOperation(
      () => oneTimeTaskQueryService.getTasksByDateRange(startDate, endDate),
      '获取任务失败',
    );
  }

  /**
   * 按标签获取任务
   */
  async function fetchTasksByTags(tags: string[]): Promise<TaskTemplate[]> {
    return executeOperation(
      () => oneTimeTaskQueryService.getTasksByTags(tags),
      '获取任务失败',
    );
  }

  /**
   * 获取目标关联的任务
   */
  async function fetchTasksByGoal(goalUuid: string): Promise<TaskTemplate[]> {
    return executeOperation(
      () => oneTimeTaskQueryService.getTasksByGoal(goalUuid),
      '获取目标任务失败',
    );
  }

  /**
   * 获取关键结果关联的任务
   */
  async function fetchTasksByKeyResult(keyResultUuid: string): Promise<TaskTemplate[]> {
    return executeOperation(
      () => oneTimeTaskQueryService.getTasksByKeyResult(keyResultUuid),
      '获取关键结果任务失败',
    );
  }

  /**
   * 获取子任务列表
   */
  async function fetchSubtasks(parentUuid: string): Promise<TaskTemplate[]> {
    return executeOperation(
      () => oneTimeTaskQueryService.getSubtasks(parentUuid),
      '获取子任务失败',
    );
  }

  // ===== 目标关联操作 =====

  /**
   * 关联任务到目标
   */
  async function linkToGoal(
    uuid: string,
    goalUuid: string,
    keyResultUuid?: string,
  ): Promise<TaskTemplate> {
    return executeOperation(
      () => oneTimeTaskGoalLinkService.linkToGoal(uuid, goalUuid, keyResultUuid),
      '关联目标失败',
    );
  }

  /**
   * 解除任务与目标的关联
   */
  async function unlinkFromGoal(uuid: string): Promise<TaskTemplate> {
    return executeOperation(
      () => oneTimeTaskGoalLinkService.unlinkFromGoal(uuid),
      '解除目标关联失败',
    );
  }

  // ===== 辅助查询方法 =====

  /**
   * 根据 UUID 查找任务
   */
  function findTaskByUuid(uuid: string): TaskTemplate | undefined {
    const result = taskStore.getTaskTemplateByUuid(uuid);
    return result === null ? undefined : result;
  }

  /**
   * 检查任务是否可以开始
   */
  function canStartTask(task: TaskTemplate): boolean {
    return (task.status as any) === 'PENDING' || (task.status as any) === 'BLOCKED';
  }

  /**
   * 检查任务是否可以完成
   */
  function canCompleteTask(task: TaskTemplate): boolean {
    return (task.status as any) === 'IN_PROGRESS';
  }

  /**
   * 检查任务是否可以取消
   */
  function canCancelTask(task: TaskTemplate): boolean {
    return (task.status as any) === 'PENDING' || (task.status as any) === 'IN_PROGRESS';
  }

  /**
   * 检查任务是否逾期
   */
  function isTaskOverdue(task: TaskTemplate): boolean {
    const dueDate = (task as any).dueDate;
    if (!dueDate) return false;
    return dueDate < Date.now() && (task.status as any) !== 'COMPLETED';
  }

  /**
   * 计算任务剩余天数
   */
  function getDaysUntilDue(task: TaskTemplate): number | null {
    const dueDate = (task as any).dueDate;
    if (!dueDate) return null;
    const diff = dueDate - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  // ===== UI 便捷方法（适配器） =====

  /**
   * 简化的获取任务列表方法（用于 UI）
   * 默认获取所有一次性任务并同步到 store
   */
  async function fetchTasks(filters?: TaskFiltersRequest): Promise<void> {
    const tasks = await fetchOneTimeTasks(filters);
    // 任务已经通过 service 层同步到 store 了
  }

  /**
   * 简化的创建任务方法（用于 UI）
   */
  async function createTask(request: CreateOneTimeTaskRequest): Promise<TaskTemplate> {
    return createOneTimeTask(request);
  }

  /**
   * 简化的更新任务方法（用于 UI）
   * TODO: Implement proper update logic
   */
  async function updateTask(uuid: string, updates: Partial<CreateOneTimeTaskRequest>): Promise<TaskTemplate> {
    throw new Error('updateTask not implemented - use specific lifecycle methods instead');
  }

  /**
   * 简化的更新任务状态方法（用于 UI）
   */
  async function updateTaskStatus(
    uuid: string,
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'CANCELLED',
  ): Promise<TaskTemplate> {
    switch (status) {
      case 'IN_PROGRESS':
        return startTask(uuid);
      case 'COMPLETED':
        return completeTask(uuid);
      case 'BLOCKED':
        return blockTask(uuid);
      case 'PENDING':
        return unblockTask(uuid);
      case 'CANCELLED':
        return cancelTask(uuid);
      default:
        throw new Error(`不支持的状态: ${status}`);
    }
  }

  /**
   * 简化的删除任务方法（用于 UI）
   * 注意：目前使用 cancelTask 来实现"删除"
   */
  async function deleteTask(uuid: string): Promise<void> {
    await cancelTask(uuid, '用户删除');
  }

  /**
   * 简化的获取单个任务方法（用于 UI）
   */
  async function getTaskByUuid(uuid: string): Promise<TaskTemplate> {
    // 先从 store 查找
    const task = findTaskByUuid(uuid);
    if (task) {
      return task;
    }

    // 如果不存在，重新加载所有任务
    await fetchTasks();
    const refreshedTask = findTaskByUuid(uuid);
    if (!refreshedTask) {
      throw new Error(`任务不存在: ${uuid}`);
    }
    return refreshedTask;
  }

  /**
   * 获取任务历史记录（用于 UI）
   * TODO: Implement API client integration
   */
  async function getTaskHistory(uuid: string): Promise<TaskContracts.TaskTemplateHistoryServerDTO[]> {
    console.warn('getTaskHistory not fully implemented');
    return [];
  }

  // ===== 返回 API =====

  return {
    // 计算属性 - 只读
    oneTimeTasks: readonly(oneTimeTasks),
    pendingTasks: readonly(pendingTasks),
    inProgressTasks: readonly(inProgressTasks),
    completedTasks: readonly(completedTasks),
    blockedTasks: readonly(blockedTasks),
    canceledTasks: readonly(canceledTasks),
    tasksByGoal,
    tasksByKeyResult,
    tasksByPriority: readonly(tasksByPriority),

    // 访问 tasks 数组（用于 UI 列表）
    tasks: oneTimeTasks,
    loading: isLoading,

    // 状态
    isLoading: readonly(isLoading),
    error: readonly(error),

    // 错误处理
    clearError,

    // UI 便捷方法（推荐使用）
    fetchTasks,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    getTaskByUuid,
    getTaskHistory,

    // 生命周期操作（原始方法）
    createOneTimeTask,
    createSubtask,
    startTask,
    completeTask,
    blockTask,
    unblockTask,
    cancelTask,

    // 查询操作
    fetchOneTimeTasks,
    fetchTodayTasks,
    fetchOverdueTasks,
    fetchUpcomingTasks,
    fetchTasksByPriority,
    fetchBlockedTasks,
    fetchTasksByDateRange,
    fetchTasksByTags,
    fetchTasksByGoal,
    fetchTasksByKeyResult,
    fetchSubtasks,

    // 目标关联
    linkToGoal,
    unlinkFromGoal,

    // 辅助方法
    findTaskByUuid,
    canStartTask,
    canCompleteTask,
    canCancelTask,
    isTaskOverdue,
    getDaysUntilDue,
  };
}
