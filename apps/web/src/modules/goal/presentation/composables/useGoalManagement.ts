/**
 * Goal Management Composable
 * 目标管理相关的业务逻辑
 *
 * 🔄 重构说明（方案 A - 简化版）：
 * - Composable 负责协调 ApplicationService 和 Store
 * - Service 直接返回实体对象或抛出错误（不包装 ServiceResult）
 * - Composable 使用 try/catch 处理错误
 * - 数据流：API → Service(转换) → Composable(存储+通知) → Store → Component
 *
 * 📝 错误处理：
 * - axios 拦截器已处理 API 错误，success: false 会抛出 Error
 * - Composable 捕获错误并设置 error 状态 + 全局通知
 */

import { ref, computed, readonly } from 'vue';
import type { CreateGoalRequest, UpdateGoalRequest } from '@dailyuse/contracts/goal';
import type { Goal } from '@dailyuse/domain-client/goal';
import { goalManagementApplicationService, goalSyncApplicationService } from '../../application/services';
import { getGoalStore } from '../stores/goalStore';
import { getGlobalMessage } from '@dailyuse/ui-vuetify';

export function useGoalManagement() {
  const goalStore = getGoalStore();
  const { success: showSuccess, error: showError, info: showInfo } = getGlobalMessage();

  // ===== 本地状态 =====
  const isOperating = ref(false);
  const operationError = ref<string | null>(null);
  const showCreateDialog = ref(false);
  const showEditDialog = ref(false);
  const editingGoal = ref<Goal | null>(null);
  const goalDialogRef = ref<any>(null);

  // ===== 计算属性 - 状态 =====
  const isLoading = computed(() => goalStore.isLoading || isOperating.value);
  const error = computed(() => goalStore.error || operationError.value);
  const goals = computed(() => goalStore.getAllGoals);
  const currentGoal = computed(() => goalStore.getSelectedGoal);

  // ===== 数据获取方法 =====

  /**
   * 获取目标列表 - 缓存优先策略
   */
  const fetchGoals = async (
    forceRefresh = false,
    params?: {
      page?: number;
      limit?: number;
      status?: string;
      dirUuid?: string;
      startDate?: string;
      endDate?: string;
    },
  ) => {
    try {
      if (!forceRefresh && goalStore.getAllGoals.length > 0) {
        return goalStore.getAllGoals;
      }

      isOperating.value = true;
      operationError.value = null;
      goalStore.setLoading(true);

      // ✅ Service 直接返回实体对象数组
      const { goals, pagination } = await goalManagementApplicationService.getGoals(params);

      // ✅ Composable 负责存储到 Store
      goalStore.setGoals(goals);
      goalStore.setPagination(pagination);

      return goals;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取目标列表失败';
      operationError.value = errorMessage;
      goalStore.setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      isOperating.value = false;
      goalStore.setLoading(false);
    }
  };

  /**
   * 根据 UUID 获取目标
   */
  const fetchGoalByUuid = async (uuid: string, forceRefresh = false) => {
    try {
      // 先尝试从缓存获取
      if (!forceRefresh) {
        const cached = goalStore.getGoalByUuid(uuid);
        if (cached) return cached;
      }

      isOperating.value = true;
      operationError.value = null;
      goalStore.setLoading(true);

      // ✅ Service 直接返回实体对象
      const goal = await goalManagementApplicationService.getGoalById(uuid);

      // ✅ Composable 负责存储到 Store
      goalStore.addOrUpdateGoal(goal);

      return goal;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取目标详情失败';
      operationError.value = errorMessage;
      goalStore.setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      isOperating.value = false;
      goalStore.setLoading(false);
    }
  };

  /**
   * 初始化数据
   */
  const initializeData = async () => {
    try {
      isOperating.value = true;
      operationError.value = null;

      await goalSyncApplicationService.syncAllGoalsAndFolders();
      showSuccess('数据加载完成');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '数据加载失败';
      operationError.value = errorMessage;
      showError(errorMessage);
      throw err;
    } finally {
      isOperating.value = false;
    }
  };

  // ===== CRUD 操作 =====

  /**
   * 创建新目标
   */
  const createGoal = async (data: CreateGoalRequest) => {
    try {
      isOperating.value = true;
      operationError.value = null;
      goalStore.setLoading(true);

      // ✅ Service 直接返回实体对象
      const goal = await goalManagementApplicationService.createGoal(data);

      // ✅ Composable 负责存储到 Store
      goalStore.addOrUpdateGoal(goal);

      showCreateDialog.value = false;
      showSuccess('目标创建成功');

      return goal;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建目标失败';
      operationError.value = errorMessage;
      goalStore.setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      isOperating.value = false;
      goalStore.setLoading(false);
    }
  };

  /**
   * 更新目标
   */
  const updateGoal = async (uuid: string, data: UpdateGoalRequest) => {
    try {
      isOperating.value = true;
      operationError.value = null;
      goalStore.setLoading(true);

      // ✅ Service 直接返回实体对象
      const goal = await goalManagementApplicationService.updateGoal(uuid, data);

      // ✅ Composable 负责更新 Store
      goalStore.addOrUpdateGoal(goal);

      showEditDialog.value = false;
      editingGoal.value = null;
      showSuccess('目标更新成功');

      return goal;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新目标失败';
      operationError.value = errorMessage;
      goalStore.setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      isOperating.value = false;
      goalStore.setLoading(false);
    }
  };

  /**
   * 删除目标
   */
  const deleteGoal = async (uuid: string) => {
    try {
      isOperating.value = true;
      operationError.value = null;
      goalStore.setLoading(true);

      // ✅ Service 返回 void 或抛出错误
      await goalManagementApplicationService.deleteGoal(uuid);

      // ✅ Composable 负责从 Store 移除
      goalStore.removeGoal(uuid);

      if (currentGoal.value?.uuid === uuid) {
        goalStore.setSelectedGoal(null);
      }

      showSuccess('目标删除成功');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除目标失败';
      operationError.value = errorMessage;
      goalStore.setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      isOperating.value = false;
      goalStore.setLoading(false);
    }
  };

  // ===== 状态管理 =====

  /**
   * 激活目标
   */
  const activateGoal = async (uuid: string) => {
    try {
      isOperating.value = true;
      operationError.value = null;
      goalStore.setLoading(true);

      const goal = await goalManagementApplicationService.activateGoal(uuid);
      goalStore.addOrUpdateGoal(goal);
      showSuccess('目标已激活');

      return goal;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '激活目标失败';
      operationError.value = errorMessage;
      goalStore.setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      isOperating.value = false;
      goalStore.setLoading(false);
    }
  };

  /**
   * 暂停目标
   */
  const pauseGoal = async (uuid: string) => {
    try {
      isOperating.value = true;
      operationError.value = null;
      goalStore.setLoading(true);

      const goal = await goalManagementApplicationService.pauseGoal(uuid);
      goalStore.addOrUpdateGoal(goal);
      showSuccess('目标已暂停');

      return goal;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '暂停目标失败';
      operationError.value = errorMessage;
      goalStore.setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      isOperating.value = false;
      goalStore.setLoading(false);
    }
  };

  /**
   * 完成目标
   */
  const completeGoal = async (uuid: string) => {
    try {
      isOperating.value = true;
      operationError.value = null;
      goalStore.setLoading(true);

      const goal = await goalManagementApplicationService.completeGoal(uuid);
      goalStore.addOrUpdateGoal(goal);
      showSuccess('目标已完成');

      return goal;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '完成目标失败';
      operationError.value = errorMessage;
      goalStore.setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      isOperating.value = false;
      goalStore.setLoading(false);
    }
  };

  /**
   * 归档目标
   */
  const archiveGoal = async (uuid: string) => {
    try {
      isOperating.value = true;
      operationError.value = null;
      goalStore.setLoading(true);

      const goal = await goalManagementApplicationService.archiveGoal(uuid);
      goalStore.addOrUpdateGoal(goal);
      showSuccess('目标已归档');

      return goal;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '归档目标失败';
      operationError.value = errorMessage;
      goalStore.setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      isOperating.value = false;
      goalStore.setLoading(false);
    }
  };

  /**
   * 刷新数据
   */
  const refresh = async () => {
    try {
      isOperating.value = true;
      operationError.value = null;

      await goalSyncApplicationService.syncAllGoalsAndFolders();
      showInfo('数据刷新完成');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '刷新失败';
      operationError.value = errorMessage;
      showError(errorMessage);
      throw err;
    } finally {
      isOperating.value = false;
    }
  };

  // ===== 对话框控制方法 =====

  const openCreateDialog = () => {
    showCreateDialog.value = true;
    editingGoal.value = null;
  };

  const openEditDialog = (goal: Goal) => {
    if (!goal) {
      console.error('[useGoalManagement] openEditDialog: goal is required');
      return;
    }
    editingGoal.value = goal;
    showEditDialog.value = true;
  };

  const closeCreateDialog = () => {
    showCreateDialog.value = false;
  };

  const closeEditDialog = () => {
    showEditDialog.value = false;
    editingGoal.value = null;
  };

  // ===== 聚合视图 =====

  /**
   * 获取Goal聚合根的完整视图
   */
  const getGoalAggregateView = async (goalUuid: string) => {
    try {
      isOperating.value = true;
      operationError.value = null;

      const { goal, rawResponse } = await goalManagementApplicationService.getGoalAggregateView(goalUuid);

      // 更新 Store
      goalStore.addOrUpdateGoal(goal);

      return { goal, rawResponse };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取目标聚合视图失败';
      operationError.value = errorMessage;
      showError(errorMessage);
      throw err;
    } finally {
      isOperating.value = false;
    }
  };

  // ===== 工具方法 =====

  const clearError = () => {
    operationError.value = null;
    goalStore.setError(null);
  };

  return {
    // 状态
    isLoading: readonly(isLoading),
    error: readonly(error),
    goals: readonly(goals),
    currentGoal: readonly(currentGoal),
    showCreateDialog,
    showEditDialog,
    editingGoal,
    goalDialogRef,

    // 数据获取
    fetchGoals,
    fetchGoalByUuid,
    initializeData,

    // CRUD 操作
    createGoal,
    updateGoal,
    deleteGoal,

    // 状态管理
    activateGoal,
    pauseGoal,
    completeGoal,
    archiveGoal,
    refresh,

    // 聚合视图
    getGoalAggregateView,

    // 对话框控制
    openCreateDialog,
    openEditDialog,
    closeCreateDialog,
    closeEditDialog,

    // 工具方法
    clearError,
  };
}

