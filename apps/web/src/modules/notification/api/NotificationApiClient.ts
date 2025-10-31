/**
 * NotificationApiClient
 * 通知 API 客户端
 */

import { apiClient } from '@/core/api/apiClient';
import type { NotificationContracts } from '@dailyuse/contracts';

type NotificationClientDTO = NotificationContracts.NotificationClientDTO;
type CreateNotificationRequest = NotificationContracts.CreateNotificationRequest;
type QueryNotificationsRequest = NotificationContracts.QueryNotificationsRequest;
type NotificationListResponse = NotificationContracts.NotificationListResponse;
type UnreadCountResponse = NotificationContracts.UnreadCountResponse;
type BatchDeleteNotificationsRequest = NotificationContracts.BatchDeleteNotificationsRequest;

export class NotificationApiClient {
  private readonly baseUrl = '/api/v1/notifications';

  /**
   * 创建通知
   */
  async createNotification(
    request: CreateNotificationRequest
  ): Promise<NotificationClientDTO> {
    const response = await apiClient.post<NotificationClientDTO>(
      this.baseUrl,
      request
    );
    return response.data;
  }

  /**
   * 查询通知列表
   */
  async findNotifications(
    query: QueryNotificationsRequest = {}
  ): Promise<NotificationListResponse> {
    const response = await apiClient.get<NotificationListResponse>(
      this.baseUrl,
      { params: query }
    );
    return response.data;
  }

  /**
   * 根据 UUID 查询通知
   */
  async findNotificationByUuid(uuid: string): Promise<NotificationClientDTO> {
    const response = await apiClient.get<NotificationClientDTO>(
      `${this.baseUrl}/${uuid}`
    );
    return response.data;
  }

  /**
   * 标记通知为已读
   */
  async markAsRead(uuid: string): Promise<NotificationClientDTO> {
    const response = await apiClient.patch<NotificationClientDTO>(
      `${this.baseUrl}/${uuid}/read`
    );
    return response.data;
  }

  /**
   * 标记所有通知为已读
   */
  async markAllAsRead(): Promise<{ success: boolean; count: number }> {
    const response = await apiClient.patch<{ success: boolean; count: number }>(
      `${this.baseUrl}/read-all`
    );
    return response.data;
  }

  /**
   * 删除通知
   */
  async deleteNotification(uuid: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(
      `${this.baseUrl}/${uuid}`
    );
    return response.data;
  }

  /**
   * 批量删除通知
   */
  async batchDeleteNotifications(
    uuids: string[]
  ): Promise<{ success: boolean; count: number }> {
    const response = await apiClient.delete<{ success: boolean; count: number }>(
      this.baseUrl,
      { data: { uuids } as BatchDeleteNotificationsRequest }
    );
    return response.data;
  }

  /**
   * 获取未读数量
   */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    const response = await apiClient.get<UnreadCountResponse>(
      `${this.baseUrl}/unread-count`
    );
    return response.data;
  }
}

// 导出单例
export const notificationApiClient = new NotificationApiClient();
