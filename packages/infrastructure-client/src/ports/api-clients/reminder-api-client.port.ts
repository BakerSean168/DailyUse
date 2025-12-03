/**
 * Reminder API Client Port Interface
 */

// TODO: Import from @dailyuse/contracts/reminder when available

/**
 * Reminder API Client Interface
 */
export interface IReminderApiClient {
  /** 创建提醒 */
  createReminder(request: unknown): Promise<unknown>;

  /** 获取提醒列表 */
  getReminders(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<unknown>;

  /** 获取提醒详情 */
  getReminderById(uuid: string): Promise<unknown>;

  /** 更新提醒 */
  updateReminder(uuid: string, request: unknown): Promise<unknown>;

  /** 删除提醒 */
  deleteReminder(uuid: string): Promise<void>;

  /** 标记提醒已完成 */
  dismissReminder(uuid: string): Promise<unknown>;
}
