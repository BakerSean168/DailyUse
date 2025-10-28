/**
 * Goal Folder Composable
 * 目标文件夹相关的业务逻辑
 */

import { ref, computed } from 'vue';
import type { GoalContracts } from '@dailyuse/contracts';
import { goalFolderApplicationService } from '../../application/services';
import { getGoalStore } from '../stores/goalStore';
import { useSnackbar } from '../../../../shared/composables/useSnackbar';

export function useGoalFolder() {
  const goalStore = getGoalStore();
  const snackbar = useSnackbar();

  // ===== 响应式状态 =====
  const isLoading = computed(() => goalStore.isLoading);
  const error = computed(() => goalStore.error);
  const folders = computed(() => goalStore.getAllGoalFolders);
  const currentFolder = computed(() => goalStore.getSelectedGoalFolder);

  // ===== 本地状态 =====
  const showCreateFolderDialog = ref(false);
  const showEditFolderDialog = ref(false);
  const editingFolder = ref<any | null>(null);

  // ===== 数据获取方法 =====

  /**
   * 获取文件夹列表
   */
  const fetchFolders = async (forceRefresh = false) => {
    try {
      if (!forceRefresh && goalStore.getAllGoalFolders.length > 0) {
        return goalStore.getAllGoalFolders;
      }

      const result = await goalFolderApplicationService.getGoalFolders();
      return result;
    } catch (error) {
      snackbar.showError('获取文件夹列表失败');
      throw error;
    }
  };

  /**
   * 根据 UUID 获取文件夹
   */
  const fetchFolderByUuid = async (uuid: string, forceRefresh = false) => {
    try {
      if (!forceRefresh) {
        const cached = goalStore.getGoalFolderByUuid(uuid);
        if (cached) return cached;
      }

      // 没有单独获取文件夹的 API，从列表中获取
      await fetchFolders(true);
      return goalStore.getGoalFolderByUuid(uuid);
    } catch (error) {
      snackbar.showError('获取文件夹详情失败');
      throw error;
    }
  };

  // ===== CRUD 操作 =====

  /**
   * 创建新文件夹
   */
  const createFolder = async (data: GoalContracts.CreateGoalFolderRequest) => {
    try {
      const response = await goalFolderApplicationService.createGoalFolder(data);
      showCreateFolderDialog.value = false;
      snackbar.showSuccess('文件夹创建成功');
      return response;
    } catch (error) {
      snackbar.showError('创建文件夹失败');
      throw error;
    }
  };

  /**
   * 更新文件夹
   */
  const updateFolder = async (uuid: string, data: GoalContracts.UpdateGoalFolderRequest) => {
    try {
      const response = await goalFolderApplicationService.updateGoalFolder(uuid, data);
      showEditFolderDialog.value = false;
      editingFolder.value = null;
      snackbar.showSuccess('文件夹更新成功');
      return response;
    } catch (error) {
      snackbar.showError('更新文件夹失败');
      throw error;
    }
  };

  /**
   * 删除文件夹
   */
  const deleteFolder = async (uuid: string) => {
    try {
      await goalFolderApplicationService.deleteGoalFolder(uuid);

      if (currentFolder.value?.uuid === uuid) {
        goalStore.setSelectedGoalFolder(null);
      }

      snackbar.showSuccess('文件夹删除成功');
    } catch (error) {
      snackbar.showError('删除文件夹失败');
      throw error;
    }
  };

  return {
    // 状态
    isLoading,
    error,
    folders,
    currentFolder,
    showCreateFolderDialog,
    showEditFolderDialog,
    editingFolder,

    // 方法
    fetchFolders,
    fetchFolderByUuid,
    createFolder,
    updateFolder,
    deleteFolder,
  };
}
