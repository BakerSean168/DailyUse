/**
 * Schedule API Client Port Interface
 */

// TODO: Import from @dailyuse/contracts/schedule when available

/**
 * Schedule API Client Interface
 */
export interface IScheduleApiClient {
  /** 创建日程 */
  createSchedule(request: unknown): Promise<unknown>;

  /** 获取日程列表 */
  getSchedules(params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<unknown>;

  /** 获取日程详情 */
  getScheduleById(uuid: string): Promise<unknown>;

  /** 更新日程 */
  updateSchedule(uuid: string, request: unknown): Promise<unknown>;

  /** 删除日程 */
  deleteSchedule(uuid: string): Promise<void>;
}
