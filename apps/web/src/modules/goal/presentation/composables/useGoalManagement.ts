/**
 * Goal Management Composable
 * 目标管理相关的业务逻辑
 */

import { ref, computed } from 'vue';
import type { GoalClientDTO, KeyResultClientDTO, CreateGoalRequest, UpdateGoalRequest } from '@dailyuse/contracts/goal';
import { goalManagementApplicationService, goalSyncApplicationService } from '../../application/services';
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
  const goalDialogRef = ref<any>(null);

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
      await goalSyncApplicationService.syncAllGoalsAndFolders();
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
  const createGoal = async (data: CreateGoalRequest) => {
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
  const updateGoal = async (uuid: string, data: UpdateGoalRequest) => {
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
      await goalSyncApplicationService.syncAllGoalsAndFolders();
      snackbar.showInfo('数据刷新完成');
    } catch (error) {
      snackbar.showError('刷新失败');
      throw error;
    }
  };

  // ===== 对话框控制方法 =====

  /**
   * 打开创建目标对话框
   */
  const openCreateDialog = () => {
    showCreateDialog.value = true;
    editingGoal.value = null;
  };

  /**
   * 打开编辑目标对话框
   */
  const openEditDialog = (goal: any) => {
    if (!goal) {
      console.error('[useGoalManagement] openEditDialog: goal is required');
      return;
    }
    editingGoal.value = goal;
    showEditDialog.value = true;
  };

  /**
   * 关闭创建对话框
   */
  const closeCreateDialog = () => {
    showCreateDialog.value = false;
  };

  /**
   * 关闭编辑对话框
   */
  const closeEditDialog = () => {
    showEditDialog.value = false;
    editingGoal.value = null;
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
    goalDialogRef,

    // 方法
    fetchGoals,
    fetchGoalByUuid,
    initializeData,
    createGoal,
    updateGoal,
    deleteGoal,
    refresh,
    
    // 对话框控制
    openCreateDialog,
    openEditDialog,
    closeCreateDialog,
    closeEditDialog,
  };
}

