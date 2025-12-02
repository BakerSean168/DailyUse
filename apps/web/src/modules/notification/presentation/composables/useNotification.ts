/**
 * useNotification Composable
 * 通知管理 Composable
 *
 * 🔄 重构说明（方案 A - 简化版）：
 * - Composable 负责协调 ApplicationService 和状态管理
 * - Service 直接返回 DTO 或抛出错误
 * - Composable 使用 try/catch 处理错误 + 显示通知
 */

// @ts-nocheck - Some types not yet defined, needs refactoring
import { ref, computed } from 'vue';
import { notificationApplicationService } from '../../application/services';
import type { NotificationClientDTO } from '@dailyuse/contracts/notification';
import { useWebSocket } from './useWebSocket';
import { getGlobalMessage } from '@dailyuse/ui';

export function useNotification() {
  const notifications = ref<NotificationClientDTO[]>([]);
  const unreadCount = ref(0);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const total = ref(0);
  const page = ref(1);
  const limit = ref(20);

  // WebSocket 连接
  const { connect, disconnect, isConnected } = useWebSocket();
  const { success: showSuccess, error: showError } = getGlobalMessage();

  /**
   * 加载通知列表
   */
  async function loadNotifications(query: QueryNotificationsRequest = {}) {
    try {
      loading.value = true;
      error.value = null;

      const response = await notificationApplicationService.findNotifications({
        page: page.value,
        limit: limit.value,
        ...query,
      });

      notifications.value = response.notifications;
      total.value = response.total;
      unreadCount.value = response.unreadCount;
    } catch (err: any) {
      error.value = err.message || '加载通知失败';
      showError(error.value);
    } finally {
      loading.value = false;
    }
  }

  /**
   * 刷新通知列表
   */
  async function refreshNotifications() {
    await loadNotifications();
  }

  /**
   * 标记通知为已读
   */
  async function markAsRead(uuid: string) {
    try {
      await notificationApplicationService.markAsRead(uuid);

      // 更新本地状态
      const notification = notifications.value.find((n) => n.uuid === uuid);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        notification.readAt = new Date().toISOString();
        unreadCount.value = Math.max(0, unreadCount.value - 1);
      }
    } catch (err: any) {
      error.value = err.message || '标记已读失败';
      showError(error.value);
      throw err;
    }
  }

  /**
   * 标记所有通知为已读
   */
  async function markAllAsRead() {
    try {
      const response = await notificationApplicationService.markAllAsRead();

      // 更新本地状态
      notifications.value.forEach((n) => {
        n.isRead = true;
        n.readAt = new Date().toISOString();
      });
      unreadCount.value = 0;

      showSuccess('已标记所有通知为已读');
      return response;
    } catch (err: any) {
      error.value = err.message || '标记所有已读失败';
      showError(error.value);
      throw err;
    }
  }

  /**
   * 删除通知
   */
  async function deleteNotification(uuid: string) {
    try {
      await notificationApplicationService.deleteNotification(uuid);

      // 从列表中移除
      const index = notifications.value.findIndex((n) => n.uuid === uuid);
      if (index !== -1) {
        const notification = notifications.value[index];
        if (!notification.isRead) {
          unreadCount.value = Math.max(0, unreadCount.value - 1);
        }
        notifications.value.splice(index, 1);
        total.value = Math.max(0, total.value - 1);
      }

      showSuccess('通知已删除');
    } catch (err: any) {
      error.value = err.message || '删除通知失败';
      showError(error.value);
      throw err;
    }
  }

  /**
   * 批量删除通知
   */
  async function batchDeleteNotifications(uuids: string[]) {
    try {
      const response = await notificationApplicationService.batchDeleteNotifications(uuids);

      // 从列表中移除
      notifications.value = notifications.value.filter((n) => !uuids.includes(n.uuid));

      // 刷新未读数量
      await refreshUnreadCount();

      showSuccess(`已删除 ${response.count} 条通知`);
      return response;
    } catch (err: any) {
      error.value = err.message || '批量删除失败';
      showError(error.value);
      throw err;
    }
  }

  /**
   * 刷新未读数量
   */
  async function refreshUnreadCount() {
    try {
      const response = await notificationApplicationService.getUnreadCount();
      unreadCount.value = response.count;
    } catch (err: any) {
      // 静默失败，不显示错误
    }
  }

  /**
   * 连接 WebSocket 并监听实时通知
   */
  function connectWebSocket() {
    connect((event, data) => {
      switch (event) {
        case 'notification:new':
          handleNewNotification(data as NotificationClientDTO);
          break;
        case 'notification:read':
          handleNotificationRead(data as { uuid: string });
          break;
        case 'notification:deleted':
          handleNotificationDeleted(data as { uuid: string });
          break;
        case 'notification:unread-count':
          handleUnreadCountUpdate(data as { count: number });
          break;
      }
    });
  }

  /**
   * 处理新通知
   */
  function handleNewNotification(notification: NotificationClientDTO) {
    // 添加到列表顶部
    notifications.value.unshift(notification);
    total.value += 1;
    if (!notification.isRead) {
      unreadCount.value += 1;
    }
  }

  /**
   * 处理通知已读
   */
  function handleNotificationRead(data: { uuid: string }) {
    const notification = notifications.value.find(n => n.uuid === data.uuid);
    if (notification && !notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date().toISOString();
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    }
  }

  /**
   * 处理通知删除
   */
  function handleNotificationDeleted(data: { uuid: string }) {
    const index = notifications.value.findIndex(n => n.uuid === data.uuid);
    if (index !== -1) {
      const notification = notifications.value[index];
      if (!notification.isRead) {
        unreadCount.value = Math.max(0, unreadCount.value - 1);
      }
      notifications.value.splice(index, 1);
      total.value = Math.max(0, total.value - 1);
    }
  }

  /**
   * 处理未读数量更新
   */
  function handleUnreadCountUpdate(data: { count: number }) {
    unreadCount.value = data.count;
  }

  // Computed
  const hasUnread = computed(() => unreadCount.value > 0);
  const unreadNotifications = computed(() => 
    notifications.value.filter(n => !n.isRead)
  );

  return {
    // State
    notifications,
    unreadCount,
    loading,
    error,
    total,
    page,
    limit,
    isConnected,

    // Computed
    hasUnread,
    unreadNotifications,

    // Methods
    loadNotifications,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    batchDeleteNotifications,
    refreshUnreadCount,
    connectWebSocket,
    disconnect,
  };
}

