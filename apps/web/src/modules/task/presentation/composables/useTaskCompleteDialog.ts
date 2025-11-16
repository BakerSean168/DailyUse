/**
 * Task Complete Dialog Composable
 * 任务完成对话框逻辑
 */

import { ref } from 'vue';
import type { TaskContracts } from '@dailyuse/contracts';
import { GoalContracts } from '@dailyuse/contracts';
import { useTaskInstance } from './useTaskInstance';
import { useTaskStore } from '../stores/taskStore';
import { useGoal } from '@/modules/goal/presentation/composables/useGoal';

interface GoalBinding {
  goalUuid: string;
  goalTitle: string;
  keyResultUuid: string;
  keyResultTitle: string;
  aggregationMethod: GoalContracts.AggregationMethod;
  currentValue: number;
  targetValue: number;
  unit?: string;
}

interface TaskCompleteDialogData {
  show: boolean;
  taskUuid: string;
  taskTitle: string;
  instanceDate: number | Date;
  goalBinding?: GoalBinding;
}

export function useTaskCompleteDialog() {
  const { completeTaskInstance } = useTaskInstance();
  const taskStore = useTaskStore();
  const { fetchGoalById } = useGoal();

  const dialogData = ref<TaskCompleteDialogData>({
    show: false,
    taskUuid: '',
    taskTitle: '',
    instanceDate: new Date(),
  });

  /**
   * 打开完成任务对话框
   */
  async function openCompleteDialog(taskInstanceUuid: string) {
    try {
      // 获取任务实例
      const instance = taskStore.getTaskInstanceByUuid(taskInstanceUuid);
      if (!instance) {
        throw new Error('任务实例不存在');
      }

      // 获取任务模板
      const template = taskStore.getTaskTemplateByUuid(instance.templateUuid);
      if (!template) {
        throw new Error('任务模板不存在');
      }

      // 准备对话框数据
      dialogData.value = {
        show: true,
        taskUuid: taskInstanceUuid,
        taskTitle: template.title,
        instanceDate: instance.instanceDate,
      };

      // 如果任务绑定了目标，获取 Goal 信息
      if (template.goalBinding) {
        const goalBinding = await fetchGoalBindingInfo(template.goalBinding);
        if (goalBinding) {
          dialogData.value.goalBinding = goalBinding;
        }
      }
    } catch (error) {
      console.error('打开完成任务对话框失败:', error);
      throw error;
    }
  }

  /**
   * 获取 Goal 绑定信息
   */
  async function fetchGoalBindingInfo(
    binding: TaskContracts.TaskGoalBindingClientDTO
  ): Promise<GoalBinding | null> {
    try {
      // 从服务器获取 Goal（会使用缓存）
      const goal = await fetchGoalById(binding.goalUuid);

      if (!goal) {
        console.warn('Goal not found:', binding.goalUuid);
        return null;
      }

      // 查找 KeyResult
      const keyResult = goal.keyResults?.find(
        (kr: GoalContracts.KeyResultClientDTO) => kr.uuid === binding.keyResultUuid
      );
      if (!keyResult) {
        console.warn('KeyResult not found:', binding.keyResultUuid);
        return null;
      }

      return {
        goalUuid: goal.uuid,
        goalTitle: goal.title,
        keyResultUuid: keyResult.uuid,
        keyResultTitle: keyResult.title,
        aggregationMethod: keyResult.progress.aggregationMethod,
        currentValue: keyResult.progress.currentValue,
        targetValue: keyResult.progress.targetValue,
        unit: keyResult.progress.unit,
      };
    } catch (error) {
      console.error('获取 Goal 绑定信息失败:', error);
      return null;
    }
  }

  /**
   * 确认完成任务
   */
  async function confirmComplete(data: {
    recordValue?: number;
    note?: string;
    duration?: number;
  }) {
    try {
      await completeTaskInstance(dialogData.value.taskUuid, data);
      dialogData.value.show = false;
    } catch (error) {
      console.error('完成任务失败:', error);
      throw error;
    }
  }

  /**
   * 取消对话框
   */
  function cancelDialog() {
    dialogData.value.show = false;
  }

  return {
    dialogData,
    openCompleteDialog,
    confirmComplete,
    cancelDialog,
  };
}
