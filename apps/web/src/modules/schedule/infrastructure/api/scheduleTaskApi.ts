/**
 * Schedule Task API
 * 调度任务 API 调用层
 */

import { ScheduleContracts } from '@dailyuse/contracts';
import { apiClient } from '@/shared/api/instances';

/**
 * 获取调度任务详情
 */
export async function getScheduleTask(
  taskUuid: string,
): Promise<ScheduleContracts.ScheduleTaskClientDTO> {
  return await apiClient.get<ScheduleContracts.ScheduleTaskClientDTO>(
    `schedules/tasks/${taskUuid}`
  );
}

/**
 * 获取调度任务执行历史
 */
export async function getScheduleTaskExecutions(
  taskUuid: string,
  limit: number = 20,
): Promise<ScheduleContracts.ScheduleExecutionClientDTO[]> {
  return await apiClient.get<ScheduleContracts.ScheduleExecutionClientDTO[]>(
    `schedules/tasks/${taskUuid}/executions`,
    {
      params: { limit },
    }
  );
}
