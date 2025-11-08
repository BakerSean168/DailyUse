/**
 * Schedule Task API
 * 调度任务 API 调用层
 */

import { ScheduleContracts } from '@dailyuse/contracts';

/**
 * 获取调度任务详情
 */
export async function getScheduleTask(
  taskUuid: string,
): Promise<ScheduleContracts.ScheduleTaskClientDTO> {
  const response = await fetch(`/api/v1/schedules/tasks/${taskUuid}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch schedule task: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * 获取调度任务执行历史
 */
export async function getScheduleTaskExecutions(
  taskUuid: string,
  limit: number = 20,
): Promise<ScheduleContracts.ScheduleExecutionClientDTO[]> {
  const url = new URL(`/api/v1/schedules/tasks/${taskUuid}/executions`, window.location.origin);
  url.searchParams.set('limit', limit.toString());

  const response = await fetch(url.toString(), {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch task executions: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data || [];
}
