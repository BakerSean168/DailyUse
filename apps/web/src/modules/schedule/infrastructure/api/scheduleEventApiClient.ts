import { SourceModule } from '@dailyuse/contracts/schedule';
import type { ScheduleClientDTO, ScheduleTaskClientDTO, ConflictDetectionResult, ScheduleStatisticsClientDTO } from '@dailyuse/contracts/schedule';
import { apiClient } from '@/shared/api/instances';

/**
 * Schedule Event API Client
 * 日程事件 API 客户端
 * 
 * Story 4-1: Schedule Event CRUD
 */

/**
 * Schedule Event API Client Class
 */
class ScheduleEventApiClient {
  private readonly baseUrl = '/api/v1/schedules/events';

  /**
   * 创建日程事件
   */
  async createSchedule(data: CreateScheduleRequestDTO): Promise<ScheduleClientDTO> {
    const response = await apiClient.post<ScheduleClientDTO>(this.baseUrl, data);
    return response;
  }

  /**
   * 获取日程事件详情
   */
  async getSchedule(uuid: string): Promise<ScheduleClientDTO> {
    const response = await apiClient.get<ScheduleClientDTO>(`${this.baseUrl}/${uuid}`);
    return response;
  }

  /**
   * 获取账户的所有日程事件
   */
  async getSchedulesByAccount(): Promise<ScheduleClientDTO[]> {
    const response = await apiClient.get<ScheduleClientDTO[]>(this.baseUrl);
    return response;
  }

  /**
   * 获取指定时间范围内的日程事件
   */
  async getSchedulesByTimeRange(params: GetSchedulesByTimeRangeRequestDTO): Promise<ScheduleClientDTO[]> {
    const response = await apiClient.get<ScheduleClientDTO[]>(this.baseUrl, {
      params: {
        startTime: params.startTime.toString(),
        endTime: params.endTime.toString(),
      },
    });
    return response;
  }

  /**
   * 更新日程事件
   */
  async updateSchedule(uuid: string, data: UpdateScheduleRequestDTO): Promise<ScheduleClientDTO> {
    const response = await apiClient.patch<ScheduleClientDTO>(`${this.baseUrl}/${uuid}`, data);
    return response;
  }

  /**
   * 删除日程事件
   */
  async deleteSchedule(uuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${uuid}`);
  }

  /**
   * 获取日程冲突详情
   * 
   * Story 4-3: Schedule Conflict Detection Integration
   */
  async getScheduleConflicts(uuid: string): Promise<ConflictDetectionResult> {
    const response = await apiClient.get<ConflictDetectionResult>(
      `${this.baseUrl}/${uuid}/conflicts`
    );
    return response;
  }
}

// Export singleton instance
export const scheduleEventApiClient = new ScheduleEventApiClient();

