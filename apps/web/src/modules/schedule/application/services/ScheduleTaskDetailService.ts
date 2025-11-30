/**
 * Schedule Task Detail Service
 * 调度任务详情服务层
 */

import type { ScheduleTaskClientDTO, ScheduleExecutionClientDTO } from '@dailyuse/contracts/schedule';
import { getScheduleTask, getScheduleTaskExecutions } from '../../infrastructure/api/scheduleTaskApi';

export class ScheduleTaskDetailService {
  /**
   * 获取任务详情
   */
  async getTaskDetail(taskUuid: string): Promise<ScheduleTaskClientDTO> {
    return await getScheduleTask(taskUuid);
  }

  /**
   * 获取任务执行历史
   */
  async getTaskExecutions(taskUuid: string, limit: number = 20): Promise<ScheduleExecutionClientDTO[]> {
    return await getScheduleTaskExecutions(taskUuid, limit);
  }
}

// 导出单例
export const scheduleTaskDetailService = new ScheduleTaskDetailService();

