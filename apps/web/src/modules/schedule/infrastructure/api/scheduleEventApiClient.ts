import { ScheduleContracts } from '@dailyuse/contracts';
import { apiClient } from '@/shared/api/instances';

/**
 * Schedule Event API Client
 * 日程事件 API 客户端
 * 
 * Story 4-1: Schedule Event CRUD
 */

export interface CreateScheduleEventRequest {
  title: string;
  description?: string;
  startTime: number;
  endTime: number;
  priority?: number;
  location?: string;
  attendees?: string[];
}

export interface UpdateScheduleEventRequest {
  title?: string;
  description?: string;
  startTime?: number;
  endTime?: number;
  priority?: number;
  location?: string;
  attendees?: string[];
}

export interface GetSchedulesByTimeRangeRequest {
  startTime: number;
  endTime: number;
}

/**
 * Schedule Event API Client Class
 */
class ScheduleEventApiClient {
  private readonly baseUrl = '/api/v1/schedules/events';

  /**
   * 创建日程事件
   */
  async createSchedule(data: CreateScheduleEventRequest): Promise<ScheduleContracts.ScheduleClientDTO> {
    const response = await apiClient.post<ScheduleContracts.ScheduleClientDTO>(this.baseUrl, data);
    return response;
  }

  /**
   * 获取日程事件详情
   */
  async getSchedule(uuid: string): Promise<ScheduleContracts.ScheduleClientDTO> {
    const response = await apiClient.get<ScheduleContracts.ScheduleClientDTO>(`${this.baseUrl}/${uuid}`);
    return response;
  }

  /**
   * 获取账户的所有日程事件
   */
  async getSchedulesByAccount(): Promise<ScheduleContracts.ScheduleClientDTO[]> {
    const response = await apiClient.get<ScheduleContracts.ScheduleClientDTO[]>(this.baseUrl);
    return response;
  }

  /**
   * 获取指定时间范围内的日程事件
   */
  async getSchedulesByTimeRange(params: GetSchedulesByTimeRangeRequest): Promise<ScheduleContracts.ScheduleClientDTO[]> {
    const response = await apiClient.get<ScheduleContracts.ScheduleClientDTO[]>(this.baseUrl, {
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
  async updateSchedule(uuid: string, data: UpdateScheduleEventRequest): Promise<ScheduleContracts.ScheduleClientDTO> {
    const response = await apiClient.patch<ScheduleContracts.ScheduleClientDTO>(`${this.baseUrl}/${uuid}`, data);
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
  async getScheduleConflicts(uuid: string): Promise<ScheduleContracts.ConflictDetectionResult> {
    const response = await apiClient.get<ScheduleContracts.ConflictDetectionResult>(
      `${this.baseUrl}/${uuid}/conflicts`
    );
    return response;
  }
}

// Export singleton instance
export const scheduleEventApiClient = new ScheduleEventApiClient();
