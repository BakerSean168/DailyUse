/**
 * Goal Management Composable
 * 目标管理相关的业务逻辑
 */

import { ref, computed } from 'vue';
import type { GoalContracts } from '@dailyuse/contracts';
import { goalManagementApplicationService, goalWebApplicationService } from '../../application/services';
import { getGoalStore } from '../stores/goalStore';
import { useSnackbar } from '../../../../shared/composables/useSnackbar';

export function useGoalManagement() {
  const goalStore = getGoalStore();
  const snackbar = useSnackbar();

  // ===== 响应式状态 =====
  const isLoading = computed(() => goalStore.isLoading);
  const error = computed(() => goalStore.error);
  const goals = computed(() => goalStore.getAllGoals);
  const currentGoal = computed(() => goalStore.getSelectedGoal);

  // ===== 本地状态 =====
  const showCreateDialog = ref(false);
  const showEditDialog = ref(false);
  const editingGoal = ref<any | null>(null);

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

      const result = await goalManagementApplicationService.getGoals(params);
      return result;
    } catch (error) {
      snackbar.showError('获取目标列表失败');
      throw error;
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

      const result = await goalManagementApplicationService.getGoalById(uuid);
      return result;
    } catch (error) {
      snackbar.showError('获取目标详情失败');
      throw error;
    }
  };

  /**
   * 初始化数据
   */
  const initializeData = async () => {
    try {
      await goalWebApplicationService.syncAllGoals();
      snackbar.showSuccess('数据加载完成');
    } catch (error) {
      snackbar.showError('数据加载失败');
      throw error;
    }
  };

  // ===== CRUD 操作 =====

  /**
   * 创建新目标
   */
  const createGoal = async (data: GoalContracts.CreateGoalRequest) => {
    try {
      const response = await goalManagementApplicationService.createGoal(data);
      showCreateDialog.value = false;
      snackbar.showSuccess('目标创建成功');
      return response;
    } catch (error) {
      snackbar.showError('创建目标失败');
      throw error;
    }
  };

  /**
   * 更新目标
   */
  const updateGoal = async (uuid: string, data: GoalContracts.UpdateGoalRequest) => {
    try {
      const response = await goalManagementApplicationService.updateGoal(uuid, data);
      showEditDialog.value = false;
      editingGoal.value = null;
      snackbar.showSuccess('目标更新成功');
      return response;
    } catch (error) {
      snackbar.showError('更新目标失败');
      throw error;
    }
  };

  /**
   * 删除目标
   */
  const deleteGoal = async (uuid: string) => {
    try {
      await goalManagementApplicationService.deleteGoal(uuid);

      if (currentGoal.value?.uuid === uuid) {
        goalStore.setSelectedGoal(null);
      }

      snackbar.showSuccess('目标删除成功');
    } catch (error) {
      snackbar.showError('删除目标失败');
      throw error;
    }
  };

  /**
   * 刷新数据
   */
  const refresh = async () => {
    try {
      await goalWebApplicationService.syncAllGoals();
      snackbar.showInfo('数据刷新完成');
    } catch (error) {
      snackbar.showError('刷新失败');
      throw error;
    }
  };

  return {
    // 状态
    isLoading,
    error,
    goals,
    currentGoal,
    showCreateDialog,
    showEditDialog,
    editingGoal,

    // 方法
    fetchGoals,
    fetchGoalByUuid,
    initializeData,
    createGoal,
    updateGoal,
    deleteGoal,
    refresh,
  };
}
