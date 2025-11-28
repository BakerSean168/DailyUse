/**
 * Reminder Group Composable
 * 提醒分组相关的业务逻辑
 */

import { ref, computed } from 'vue';
import type { ReminderTemplateClientDTO, ReminderInstanceClientDTO, ReminderGroupClientDTO } from '@dailyuse/contracts/reminder';
import { reminderGroupApplicationService } from '../../application/services';
import { getReminderStore } from '../stores/reminderStore';
import { useSnackbar } from '@/shared/composables/useSnackbar';

export function useReminderGroup() {
  const reminderStore = getReminderStore();
  const snackbar = useSnackbar();

  // ===== 响应式状态 =====
  const isLoading = computed(() => reminderStore.isLoading);
  const error = computed(() => reminderStore.error);
  const groups = computed(() => reminderStore.reminderGroups);
  const currentGroup = computed(() => reminderStore.selectedGroup);

  // ===== 本地状态 =====
  const showCreateGroupDialog = ref(false);
  const showEditGroupDialog = ref(false);
  const editingGroup = ref<ReminderGroupClientDTO | null>(null);

  // ===== 数据获取方法 =====

  /**
   * 获取分组列表
   */
  const fetchGroups = async (forceRefresh = false) => {
    try {
      if (!forceRefresh && reminderStore.reminderGroups.length > 0) {
        return reminderStore.reminderGroups;
      }

      const result = await reminderGroupApplicationService.getReminderGroups();
      return result.items;
    } catch (error) {
      snackbar.showError('获取分组列表失败');
      throw error;
    }
  };

  /**
   * 根据 UUID 获取分组
   */
  const fetchGroupByUuid = async (uuid: string, forceRefresh = false) => {
    try {
      if (!forceRefresh) {
        const cached = reminderStore.getReminderGroupByUuid(uuid);
        if (cached) return cached;
      }

      const group = await reminderGroupApplicationService.getReminderGroup(uuid);
      return group;
    } catch (error) {
      snackbar.showError('获取分组详情失败');
      throw error;
    }
  };

  // ===== CRUD 操作 =====

  /**
   * 创建新分组
   */
  const createGroup = async (data: CreateReminderGroupRequestDTO) => {
    try {
      const response = await reminderGroupApplicationService.createReminderGroup(data);
      showCreateGroupDialog.value = false;
      snackbar.showSuccess('分组创建成功');
      return response;
    } catch (error) {
      snackbar.showError('创建分组失败');
      throw error;
    }
  };

  /**
   * 更新分组
   */
  const updateGroup = async (
    uuid: string,
    data: UpdateReminderGroupRequestDTO,
  ) => {
    try {
      const response = await reminderGroupApplicationService.updateReminderGroup(uuid, data);
      showEditGroupDialog.value = false;
      editingGroup.value = null;
      snackbar.showSuccess('分组更新成功');
      return response;
    } catch (error) {
      snackbar.showError('更新分组失败');
      throw error;
    }
  };

  /**
   * 删除分组
   */
  const deleteGroup = async (uuid: string) => {
    try {
      await reminderGroupApplicationService.deleteReminderGroup(uuid);

      if (currentGroup.value?.uuid === uuid) {
        reminderStore.setSelectedGroup(null);
      }

      snackbar.showSuccess('分组删除成功');
    } catch (error) {
      snackbar.showError('删除分组失败');
      throw error;
    }
  };

  /**
   * 切换分组启用状态
   */
  const toggleGroupStatus = async (uuid: string) => {
    try {
      const response = await reminderGroupApplicationService.toggleReminderGroupStatus(uuid);
      snackbar.showSuccess(`分组已${response.enabled ? '启用' : '禁用'}`);
      return response;
    } catch (error) {
      snackbar.showError('切换分组状态失败');
      throw error;
    }
  };

  return {
    // 状态
    isLoading,
    error,
    groups,
    currentGroup,
    showCreateGroupDialog,
    showEditGroupDialog,
    editingGroup,

    // 方法
    fetchGroups,
    fetchGroupByUuid,
    createGroup,
    updateGroup,
    deleteGroup,
    toggleGroupStatus,
  };
}

