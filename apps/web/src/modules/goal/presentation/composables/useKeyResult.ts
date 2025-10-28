/**
 * Key Result Composable
 * 关键结果相关的业务逻辑
 */

import { ref } from 'vue';
import type { GoalContracts } from '@dailyuse/contracts';
import { goalWebApplicationService } from '../../application/services';
import { useSnackbar } from '../../../../shared/composables/useSnackbar';

export function useKeyResult() {
  const snackbar = useSnackbar();

  // ===== 本地状态 =====
  const showCreateKeyResultDialog = ref(false);
  const showEditKeyResultDialog = ref(false);
  const editingKeyResult = ref<any | null>(null);
  const currentGoalUuid = ref<string | null>(null);

  // ===== CRUD 操作 =====

  /**
   * 获取目标的关键结果列表
   */
  const fetchKeyResultsByGoal = async (goalUuid: string) => {
    try {
      const result = await goalWebApplicationService.getKeyResultsByGoal(goalUuid);
      return result;
    } catch (error) {
      snackbar.showError('获取关键结果列表失败');
      throw error;
    }
  };

  /**
   * 创建关键结果
   */
  const createKeyResult = async (
    goalUuid: string,
    data: {
      name: string;
      description?: string;
      startValue: number;
      targetValue: number;
      currentValue?: number;
      unit: string;
      weight: number;
      calculationMethod?: 'sum' | 'average' | 'max' | 'min' | 'custom';
    },
  ) => {
    try {
      const response = await goalWebApplicationService.createKeyResultForGoal(goalUuid, data);
      showCreateKeyResultDialog.value = false;
      snackbar.showSuccess('关键结果创建成功');
      return response;
    } catch (error) {
      snackbar.showError('创建关键结果失败');
      throw error;
    }
  };

  /**
   * 更新关键结果
   */
  const updateKeyResult = async (
    goalUuid: string,
    keyResultUuid: string,
    data: GoalContracts.UpdateKeyResultRequest,
  ) => {
    try {
      const response = await goalWebApplicationService.updateKeyResultForGoal(
        goalUuid,
        keyResultUuid,
        data,
      );
      showEditKeyResultDialog.value = false;
      editingKeyResult.value = null;
      snackbar.showSuccess('关键结果更新成功');
      return response;
    } catch (error) {
      snackbar.showError('更新关键结果失败');
      throw error;
    }
  };

  /**
   * 删除关键结果
   */
  const deleteKeyResult = async (goalUuid: string, keyResultUuid: string) => {
    try {
      await goalWebApplicationService.deleteKeyResultForGoal(goalUuid, keyResultUuid);
      snackbar.showSuccess('关键结果删除成功');
    } catch (error) {
      snackbar.showError('删除关键结果失败');
      throw error;
    }
  };

  return {
    // 状态
    showCreateKeyResultDialog,
    showEditKeyResultDialog,
    editingKeyResult,
    currentGoalUuid,

    // 方法
    fetchKeyResultsByGoal,
    createKeyResult,
    updateKeyResult,
    deleteKeyResult,
  };
}
