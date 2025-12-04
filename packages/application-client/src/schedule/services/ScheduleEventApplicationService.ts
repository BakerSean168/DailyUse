/**
 * Schedule Event Application Service
 *
 * 日程事件应用服务 - 负责 ScheduleEvent 的 CRUD 操作
 *
 * 设计说明：
 * - ApplicationService 只负责 API 调用 + DTO → Entity 转换
 * - 不再直接依赖 Store，返回数据给调用方
 * - Store 操作由 Composable 层负责
 * - 这样确保无循环依赖，且 Service 可独立测试
 */

import type {
  ScheduleClientDTO,
  CreateScheduleRequest,
  UpdateScheduleRequest,
  GetSchedulesByTimeRangeRequest,
  ConflictDetectionResult,
} from '@dailyuse/contracts/schedule';
import type { IScheduleEventApiClient } from '@dailyuse/infrastructure-client';

/**
 * Schedule Event Application Service
 */
export class ScheduleEventApplicationService {
  constructor(private readonly apiClient: IScheduleEventApiClient) {}

  /**
   * 创建日程事件
   */
  async createSchedule(data: CreateScheduleRequest): Promise<ScheduleClientDTO> {
    return this.apiClient.createSchedule(data);
  }

  /**
   * 获取日程事件详情
   */
  async getSchedule(uuid: string): Promise<ScheduleClientDTO> {
    return this.apiClient.getSchedule(uuid);
  }

  /**
   * 获取账户的所有日程事件
   */
  async getSchedulesByAccount(): Promise<ScheduleClientDTO[]> {
    return this.apiClient.getSchedulesByAccount();
  }

  /**
   * 获取指定时间范围内的日程事件
   */
  async getSchedulesByTimeRange(
    params: GetSchedulesByTimeRangeRequest,
  ): Promise<ScheduleClientDTO[]> {
    return this.apiClient.getSchedulesByTimeRange(params);
  }

  /**
   * 更新日程事件
   */
  async updateSchedule(uuid: string, data: UpdateScheduleRequest): Promise<ScheduleClientDTO> {
    return this.apiClient.updateSchedule(uuid, data);
  }

  /**
   * 删除日程事件
   */
  async deleteSchedule(uuid: string): Promise<void> {
    return this.apiClient.deleteSchedule(uuid);
  }

  /**
   * 获取日程冲突详情
   */
  async getScheduleConflicts(uuid: string): Promise<ConflictDetectionResult> {
    return this.apiClient.getScheduleConflicts(uuid);
  }
}

/**
 * Factory function to create ScheduleEventApplicationService
 */
export function createScheduleEventApplicationService(
  apiClient: IScheduleEventApiClient,
): ScheduleEventApplicationService {
  return new ScheduleEventApplicationService(apiClient);
}
