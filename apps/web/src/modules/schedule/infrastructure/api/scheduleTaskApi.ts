/**
 * Schedule Task API
 * 调度任务 API 调用层
 */

import { SourceModule } from '@dailyuse/contracts/schedule';
import type { ScheduleClientDTO, ScheduleTaskClientDTO, ConflictDetectionResult, ScheduleStatisticsClientDTO } from '@dailyuse/contracts/schedule';
import { apiClient } from '@/shared/api/instances';

/**
 * 获取调度任务详情
 */
export async function getScheduleTask(
  taskUuid: string,
): Promise<ScheduleTaskClientDTO> {
  return await apiClient.get<ScheduleTaskClientDTO>(
    `schedules/tasks/${taskUuid}`
  );
}

/**
 * 获取调度任务执行历史
 */
export async function getScheduleTaskExecutions(
  taskUuid: string,
  limit: number = 20,
): Promise<ScheduleExecutionClientDTO[]> {
  return await apiClient.get<ScheduleExecutionClientDTO[]>(
    `schedules/tasks/${taskUuid}/executions`,
    {
      params: { limit },
    }
  );
}

