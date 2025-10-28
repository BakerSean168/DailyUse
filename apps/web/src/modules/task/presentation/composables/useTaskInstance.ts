/**
 * Task Instance Composable
 * 任务实例相关的组合式函数
 */

import { ref, computed, readonly } from 'vue';
import type { TaskContracts } from '@dailyuse/contracts';
import type { TaskDomain } from '@dailyuse/domain-client';
import { taskInstanceApplicationService } from '../../application/services';
import { useTaskStore } from '../stores/taskStore';

type TaskInstance = TaskDomain.TaskInstance;

/**
 * 任务实例管理 Composable
 */
export function useTaskInstance() {
  // ===== 服务和存储 =====
  const taskStore = useTaskStore();

  // ===== 本地状态 =====
  const isOperating = ref(false);
  const operationError = ref<string | null>(null);

  // ===== 计算属性 - 数据访问 =====

  /**
   * 所有任务实例
   */
  const taskInstances = computed(() => taskStore.getAllTaskInstances);

  /**
   * 待处理的任务实例
   */
  const pendingTaskInstances = computed(() => taskStore.getInstancesByStatus('PENDING'));

  /**
   * 进行中的任务实例
   */
  const inProgressTaskInstances = computed(() => taskStore.getInstancesByStatus('IN_PROGRESS'));

  /**
   * 已完成的任务实例
   */
  const completedTaskInstances = computed(() => taskStore.getInstancesByStatus('COMPLETED'));

  /**
   * 已跳过的任务实例
   */
  const skippedTaskInstances = computed(() => taskStore.getInstancesByStatus('SKIPPED'));

  /**
   * 已过期的任务实例
   */
  const expiredTaskInstances = computed(() => taskStore.getInstancesByStatus('EXPIRED'));

  /**
   * 今日任务
   */
  const todayTaskInstances = computed(() => taskStore.getTodayTaskInstances);

  /**
   * 本周任务
   */
  const thisWeekTaskInstances = computed(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    return taskStore.getAllTaskInstances.filter((task) => {
      // TODO: 需要正确的 scheduledDate 属性
      // if (!task.timeConfig?.scheduledDate) return false;
      // const scheduledDate = new Date(task.timeConfig.scheduledDate);
      // return scheduledDate >= startOfWeek && scheduledDate < endOfWeek;
      return false;
    });
  });

  /**
   * 按模板分组的实例
   */
  const taskInstancesByTemplate = computed(() => (templateUuid: string) => {
    return taskStore.getInstancesByTemplateUuid(templateUuid);
  });

  /**
   * UI 状态
   */
  const isLoading = computed(() => taskStore.isLoading || isOperating.value);
  const error = computed(() => taskStore.error || operationError.value);

  // ===== 任务实例 CRUD 操作 =====

  /**
   * 创建任务实例
   */
  async function createTaskInstance(request: any) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await taskInstanceApplicationService.createTaskInstance(request);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建任务实例失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 获取任务实例详情
   */
  async function fetchTaskInstance(uuid: string) {
    try {
      isOperating.value = true;
      operationError.value = null;

      // 先从缓存获取
      const cached = taskStore.getTaskInstanceByUuid(uuid);
      if (cached) {
        return cached;
      }

      // 缓存中没有，从服务器获取
      const result = await taskInstanceApplicationService.getTaskInstanceById(uuid);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取任务实例详情失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 更新任务实例
   */
  async function updateTaskInstance(uuid: string, request: any) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await taskInstanceApplicationService.updateTaskInstance(uuid, request);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新任务实例失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 删除任务实例
   */
  async function deleteTaskInstance(uuid: string) {
    try {
      isOperating.value = true;
      operationError.value = null;

      await taskInstanceApplicationService.deleteTaskInstance(uuid);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除任务实例失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  // ===== 状态管理操作 =====

  /**
   * 完成任务
   */
  async function completeTaskInstance(uuid: string, result?: string) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const completedTask = await taskInstanceApplicationService.completeTaskInstance(uuid, result);
      return completedTask;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '完成任务失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 撤销完成任务
   */
  async function undoCompleteTaskInstance(uuid: string) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await taskInstanceApplicationService.undoCompleteTaskInstance(uuid);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '撤销完成任务失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 重新安排任务
   */
  async function rescheduleTaskInstance(uuid: string, request: any) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await taskInstanceApplicationService.rescheduleTaskInstance(uuid, request);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '重新安排任务失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 取消任务
   */
  async function cancelTaskInstance(uuid: string, reason?: string) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await taskInstanceApplicationService.cancelTaskInstance(uuid, reason);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '取消任务失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  // ===== 查询方法 =====

  /**
   * 搜索任务实例
   */
  async function searchTaskInstances(params: {
    query: string;
    page?: number;
    limit?: number;
    status?: string;
  }) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await taskInstanceApplicationService.searchTaskInstances(params.query, {
        page: params.page,
        limit: params.limit,
      });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '搜索任务实例失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 获取今日任务
   */
  async function getTodayTasks() {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await taskInstanceApplicationService.getTodayTasks();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取今日任务失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 获取即将到来的任务
   */
  async function getUpcomingTasks(days = 7) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await taskInstanceApplicationService.getUpcomingTasks(days);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取即将到来的任务失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 获取逾期任务
   */
  async function getOverdueTasks() {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await taskInstanceApplicationService.getOverdueTasks();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取逾期任务失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  // ===== 工具方法 =====

  /**
   * 清除错误状态
   */
  function clearError() {
    operationError.value = null;
  }

  /**
   * 统计信息
   */
  const statistics = computed(() => ({
    total: taskInstances.value.length,
    pending: pendingTaskInstances.value.length,
    inProgress: inProgressTaskInstances.value.length,
    completed: completedTaskInstances.value.length,
    skipped: skippedTaskInstances.value.length,
    expired: expiredTaskInstances.value.length,
    today: todayTaskInstances.value.length,
    thisWeek: thisWeekTaskInstances.value.length,
  }));

  // ===== 返回接口 =====

  return {
    // 状态
    isLoading: readonly(isLoading),
    error: readonly(error),
    statistics: readonly(statistics),

    // 数据
    taskInstances: readonly(taskInstances),
    pendingTaskInstances: readonly(pendingTaskInstances),
    inProgressTaskInstances: readonly(inProgressTaskInstances),
    completedTaskInstances: readonly(completedTaskInstances),
    skippedTaskInstances: readonly(skippedTaskInstances),
    expiredTaskInstances: readonly(expiredTaskInstances),
    todayTaskInstances: readonly(todayTaskInstances),
    thisWeekTaskInstances: readonly(thisWeekTaskInstances),
    taskInstancesByTemplate: readonly(taskInstancesByTemplate),

    // CRUD 操作
    createTaskInstance,
    fetchTaskInstance,
    updateTaskInstance,
    deleteTaskInstance,

    // 状态管理
    completeTaskInstance,
    undoCompleteTaskInstance,
    rescheduleTaskInstance,
    cancelTaskInstance,

    // 查询方法
    searchTaskInstances,
    getTodayTasks,
    getUpcomingTasks,
    getOverdueTasks,

    // 工具方法
    clearError,
  };
}

/**
 * 轻量级任务实例数据访问
 * 只提供数据访问，不执行网络操作
 */
export function useTaskInstanceData() {
  const taskStore = useTaskStore();

  return {
    // 状态
    isLoading: computed(() => taskStore.isLoading),
    error: computed(() => taskStore.error),

    // 数据访问
    taskInstances: computed(() => taskStore.getAllTaskInstances),
    pendingTaskInstances: computed(() => taskStore.getInstancesByStatus('PENDING')),
    inProgressTaskInstances: computed(() => taskStore.getInstancesByStatus('IN_PROGRESS')),
    completedTaskInstances: computed(() => taskStore.getInstancesByStatus('COMPLETED')),
    skippedTaskInstances: computed(() => taskStore.getInstancesByStatus('SKIPPED')),
    expiredTaskInstances: computed(() => taskStore.getInstancesByStatus('EXPIRED')),
    todayTaskInstances: computed(() => taskStore.getTodayTaskInstances),

    // 查询方法
    getTaskInstanceByUuid: taskStore.getTaskInstanceByUuid.bind(taskStore),
    getInstancesByTemplateUuid: taskStore.getInstancesByTemplateUuid.bind(taskStore),

    // 统计信息
    statistics: computed(() => ({
      total: taskStore.getAllTaskInstances.length,
      pending: taskStore.getInstancesByStatus('PENDING').length,
      inProgress: taskStore.getInstancesByStatus('IN_PROGRESS').length,
      completed: taskStore.getInstancesByStatus('COMPLETED').length,
      skipped: taskStore.getInstancesByStatus('SKIPPED').length,
      expired: taskStore.getInstancesByStatus('EXPIRED').length,
      today: taskStore.getTodayTaskInstances.length,
    })),
  };
}
