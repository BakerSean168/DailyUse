/**
 * useScheduleTaskDetail Composable
 * 调度任务详情状态管理
 */

import { ref, type Ref } from 'vue';
import { ScheduleContracts } from '@dailyuse/contracts';
import { scheduleTaskDetailService } from '../../application/services/ScheduleTaskDetailService';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('useScheduleTaskDetail');

export function useScheduleTaskDetail() {
  // 任务详情状态
  const task: Ref<ScheduleContracts.ScheduleTaskClientDTO | null> = ref(null);
  const isLoading = ref(false);
  const error: Ref<string | null> = ref(null);

  // 执行历史状态
  const executions: Ref<ScheduleContracts.ScheduleExecutionClientDTO[]> = ref([]);
  const isLoadingExecutions = ref(false);

  /**
   * 加载任务详情
   */
  async function loadTaskDetail(taskUuid: string) {
    isLoading.value = true;
    error.value = null;

    try {
      logger.info('Loading task detail', { taskUuid });
      task.value = await scheduleTaskDetailService.getTaskDetail(taskUuid);
      logger.info('Task detail loaded successfully', { taskUuid });
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载任务详情失败';
      error.value = message;
      logger.error('Failed to load task detail', { error: err, taskUuid });
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 加载执行历史
   */
  async function loadExecutions(taskUuid: string, limit: number = 20) {
    isLoadingExecutions.value = true;

    try {
      logger.info('Loading task executions', { taskUuid, limit });
      executions.value = await scheduleTaskDetailService.getTaskExecutions(taskUuid, limit);
      logger.info('Task executions loaded successfully', { 
        taskUuid, 
        count: executions.value.length 
      });
    } catch (err) {
      logger.error('Failed to load task executions', { error: err, taskUuid });
      // 执行历史加载失败不抛出错误，只记录日志
      executions.value = [];
    } finally {
      isLoadingExecutions.value = false;
    }
  }

  /**
   * 刷新执行历史
   */
  async function refreshExecutions(taskUuid: string, limit: number = 20) {
    await loadExecutions(taskUuid, limit);
  }

  /**
   * 清空状态
   */
  function clearState() {
    task.value = null;
    executions.value = [];
    error.value = null;
    isLoading.value = false;
    isLoadingExecutions.value = false;
  }

  return {
    // 状态
    task,
    isLoading,
    error,
    executions,
    isLoadingExecutions,

    // 方法
    loadTaskDetail,
    loadExecutions,
    refreshExecutions,
    clearState,
  };
}
