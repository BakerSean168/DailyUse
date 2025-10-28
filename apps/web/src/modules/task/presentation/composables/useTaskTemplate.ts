/**
 * Task Template Composable
 * 任务模板相关的组合式函数
 */

import { ref, computed, readonly } from 'vue';
import type { TaskContracts } from '@dailyuse/contracts';
import type { TaskDomain } from '@dailyuse/domain-client';
import { taskTemplateApplicationService } from '../../application/services';
import { useTaskStore } from '../stores/taskStore';

type TaskTemplate = TaskDomain.TaskTemplate;

/**
 * 任务模板管理 Composable
 */
export function useTaskTemplate() {
  // ===== 服务和存储 =====
  const taskStore = useTaskStore();

  // ===== 本地状态 =====
  const isOperating = ref(false);
  const operationError = ref<string | null>(null);

  // ===== 计算属性 - 数据访问 =====

  /**
   * 所有任务模板
   */
  const taskTemplates = computed(() => taskStore.getAllTaskTemplates);

  /**
   * 激活的任务模板
   */
  const activeTaskTemplates = computed(() =>
    taskStore.getAllTaskTemplates.filter((t) => t.status === 'ACTIVE'),
  );

  /**
   * 暂停的任务模板
   */
  const pausedTaskTemplates = computed(() =>
    taskStore.getAllTaskTemplates.filter((t) => t.status === 'PAUSED'),
  );

  /**
   * 归档的任务模板
   */
  const archivedTaskTemplates = computed(() =>
    taskStore.getAllTaskTemplates.filter((t) => t.status === 'ARCHIVED'),
  );

  /**
   * 按目标分组的模板
   */
  const taskTemplatesByGoal = computed(() => (goalUuid: string) => {
    return taskStore.getAllTaskTemplates.filter(
      (t) => t.goalBinding && t.goalBinding.goalUuid === goalUuid,
    );
  });

  /**
   * 按关键结果分组的模板
   */
  const taskTemplatesByKeyResult = computed(() => (keyResultUuid: string) => {
    return taskStore.getAllTaskTemplates.filter(
      (t) => t.goalBinding && t.goalBinding.keyResultUuid === keyResultUuid,
    );
  });

  /**
   * UI 状态
   */
  const isLoading = computed(() => taskStore.isLoading || isOperating.value);
  const error = computed(() => taskStore.error || operationError.value);

  // ===== 任务模板 CRUD 操作 =====

  /**
   * 创建任务模板
   */
  async function createTaskTemplate(request: any) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await taskTemplateApplicationService.createTaskTemplate(request);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建任务模板失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 通过元模板创建任务模板
   */
  async function createTaskTemplateByMetaTemplate(metaTemplateUuid: string): Promise<TaskTemplate> {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result =
        await taskTemplateApplicationService.createTaskTemplateByMetaTemplate(metaTemplateUuid);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '通过元模板创建任务模板失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 获取任务模板列表
   */
  async function fetchTaskTemplates(params?: {
    page?: number;
    limit?: number;
    status?: string;
    goalUuid?: string;
  }) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await taskTemplateApplicationService.getTaskTemplates(params);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取任务模板列表失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 获取任务模板详情
   */
  async function fetchTaskTemplate(uuid: string) {
    try {
      isOperating.value = true;
      operationError.value = null;

      // 先从缓存获取
      const cached = taskStore.getTaskTemplateByUuid(uuid);
      if (cached) {
        return cached;
      }

      // 缓存中没有，从服务器获取
      const result = await taskTemplateApplicationService.getTaskTemplateById(uuid);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取任务模板详情失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 更新任务模板
   */
  async function updateTaskTemplate(uuid: string, request: any) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await taskTemplateApplicationService.updateTaskTemplate(uuid, request);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新任务模板失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 删除任务模板
   */
  async function deleteTaskTemplate(uuid: string) {
    try {
      isOperating.value = true;
      operationError.value = null;

      await taskTemplateApplicationService.deleteTaskTemplate(uuid);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除任务模板失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  // ===== 生命周期管理 =====

  /**
   * 激活任务模板
   */
  async function activateTaskTemplate(uuid: string) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await taskTemplateApplicationService.activateTaskTemplate(uuid);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '激活任务模板失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  /**
   * 暂停任务模板
   */
  async function pauseTaskTemplate(uuid: string) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await taskTemplateApplicationService.pauseTaskTemplate(uuid);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '暂停任务模板失败';
      operationError.value = errorMessage;
      throw error;
    } finally {
      isOperating.value = false;
    }
  }

  // ===== 查询方法 =====

  /**
   * 搜索任务模板
   */
  async function searchTaskTemplates(params: {
    query: string;
    page?: number;
    limit?: number;
    status?: string;
  }) {
    try {
      isOperating.value = true;
      operationError.value = null;

      const result = await taskTemplateApplicationService.searchTaskTemplates(params.query, {
        page: params.page,
        limit: params.limit,
      });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '搜索任务模板失败';
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
    total: taskTemplates.value.length,
    active: activeTaskTemplates.value.length,
    paused: pausedTaskTemplates.value.length,
    archived: archivedTaskTemplates.value.length,
  }));

  // ===== 返回接口 =====

  return {
    // 状态
    isLoading: readonly(isLoading),
    error: readonly(error),
    statistics: readonly(statistics),

    // 数据
    taskTemplates: readonly(taskTemplates),
    activeTaskTemplates: readonly(activeTaskTemplates),
    pausedTaskTemplates: readonly(pausedTaskTemplates),
    archivedTaskTemplates: readonly(archivedTaskTemplates),
    taskTemplatesByGoal: readonly(taskTemplatesByGoal),
    taskTemplatesByKeyResult: readonly(taskTemplatesByKeyResult),

    // CRUD 操作
    createTaskTemplate,
    createTaskTemplateByMetaTemplate,
    fetchTaskTemplates,
    fetchTaskTemplate,
    updateTaskTemplate,
    deleteTaskTemplate,

    // 生命周期管理
    activateTaskTemplate,
    pauseTaskTemplate,

    // 查询方法
    searchTaskTemplates,

    // 工具方法
    clearError,
  };
}

/**
 * 轻量级任务模板数据访问
 * 只提供数据访问，不执行网络操作
 */
export function useTaskTemplateData() {
  const taskStore = useTaskStore();

  return {
    // 状态
    isLoading: computed(() => taskStore.isLoading),
    error: computed(() => taskStore.error),

    // 数据访问
    taskTemplates: computed(() => taskStore.getAllTaskTemplates),
    activeTaskTemplates: computed(() =>
      taskStore.getAllTaskTemplates.filter((t) => t.status === 'ACTIVE'),
    ),
    pausedTaskTemplates: computed(() =>
      taskStore.getAllTaskTemplates.filter((t) => t.status === 'PAUSED'),
    ),
    archivedTaskTemplates: computed(() =>
      taskStore.getAllTaskTemplates.filter((t) => t.status === 'ARCHIVED'),
    ),

    // 查询方法
    getTaskTemplateByUuid: taskStore.getTaskTemplateByUuid.bind(taskStore),

    // 统计信息
    statistics: computed(() => ({
      total: taskStore.getAllTaskTemplates.length,
      active: taskStore.getAllTaskTemplates.filter((t) => t.status === 'ACTIVE').length,
      paused: taskStore.getAllTaskTemplates.filter((t) => t.status === 'PAUSED').length,
      archived: taskStore.getAllTaskTemplates.filter((t) => t.status === 'ARCHIVED').length,
    })),
  };
}
