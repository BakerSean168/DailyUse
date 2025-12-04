/**
 * Notification Application Service
 * 通知应用服务 - 负责通知的 CRUD 操作
 *
 * 🔄 包提取版本：
 * - 使用依赖注入的 INotificationApiClient
 * - 不依赖 Store（Store 操作由调用层负责）
 * - 返回纯数据，由调用层决定如何处理状态
 */

import type { NotificationClientDTO } from '@dailyuse/contracts/notification';
import type {
  INotificationApiClient,
  CreateNotificationRequest,
  QueryNotificationsRequest,
  NotificationListResponse,
  UnreadCountResponse,
} from '@dailyuse/infrastructure-client/ports';

export class NotificationApplicationService {
  constructor(private readonly notificationApiClient: INotificationApiClient) {}

  /**
   * 创建通知
   */
  async createNotification(data: CreateNotificationRequest): Promise<NotificationClientDTO> {
    return this.notificationApiClient.createNotification(data);
  }

  /**
   * 查询通知列表
   */
  async findNotifications(query: QueryNotificationsRequest = {}): Promise<NotificationListResponse> {
    return this.notificationApiClient.findNotifications(query);
  }

  /**
   * 根据 UUID 获取通知详情
   */
  async findNotificationByUuid(uuid: string): Promise<NotificationClientDTO> {
    return this.notificationApiClient.findNotificationByUuid(uuid);
  }

  /**
   * 标记通知为已读
   */
  async markAsRead(uuid: string): Promise<NotificationClientDTO> {
    return this.notificationApiClient.markAsRead(uuid);
  }

  /**
   * 标记所有通知为已读
   */
  async markAllAsRead(): Promise<{ success: boolean; count: number }> {
    return this.notificationApiClient.markAllAsRead();
  }

  /**
   * 删除通知
   */
  async deleteNotification(uuid: string): Promise<{ success: boolean }> {
    return this.notificationApiClient.deleteNotification(uuid);
  }

  /**
   * 批量删除通知
   */
  async batchDeleteNotifications(uuids: string[]): Promise<{ success: boolean; count: number }> {
    return this.notificationApiClient.batchDeleteNotifications(uuids);
  }

  /**
   * 获取未读数量
   */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    return this.notificationApiClient.getUnreadCount();
  }
}

/**
 * 工厂函数 - 创建通知应用服务实例
 */
export function createNotificationApplicationService(
  notificationApiClient: INotificationApiClient,
): NotificationApplicationService {
  return new NotificationApplicationService(notificationApiClient);
}
