/**
 * useNotification Hook
 *
 * 通知管理 Hook
 */

import { useState, useCallback, useEffect } from 'react';
import { notificationApplicationService } from '../../application/services';
import type { NotificationClientDTO } from '@dailyuse/contracts/notification';
import type { FindNotificationsInput } from '@dailyuse/application-client';

export interface NotificationState {
  notifications: NotificationClientDTO[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

export interface UseNotificationReturn extends NotificationState {
  loadNotifications: (input?: FindNotificationsInput) => Promise<void>;
  loadUnreadCount: () => Promise<void>;
  markAsRead: (uuid: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (uuid: string) => Promise<void>;
  batchDeleteNotifications: (uuids: string[]) => Promise<void>;
  refreshAll: () => Promise<void>;
}

/**
 * 通知管理 Hook
 */
export function useNotification(): UseNotificationReturn {
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
  });

  /**
   * 加载通知列表
   */
  const loadNotifications = useCallback(async (input?: FindNotificationsInput) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const notifications = await notificationApplicationService.findNotifications(input);
      setState(prev => ({
        ...prev,
        notifications,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '加载通知失败',
      }));
    }
  }, []);

  /**
   * 加载未读数量
   */
  const loadUnreadCount = useCallback(async () => {
    try {
      const result = await notificationApplicationService.getUnreadCount();
      setState(prev => ({
        ...prev,
        unreadCount: result.count,
      }));
    } catch (error) {
      console.error('加载未读数量失败:', error);
    }
  }, []);

  /**
   * 标记为已读
   */
  const markAsRead = useCallback(async (uuid: string) => {
    try {
      const updated = await notificationApplicationService.markAsRead(uuid);
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n =>
          n.uuid === uuid ? updated : n
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '标记已读失败',
      }));
    }
  }, []);

  /**
   * 标记全部为已读
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationApplicationService.markAllAsRead();
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => ({
          ...n,
          isRead: true,
          readAt: Date.now(),
        })),
        unreadCount: 0,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '标记全部已读失败',
      }));
    }
  }, []);

  /**
   * 删除通知
   */
  const deleteNotification = useCallback(async (uuid: string) => {
    try {
      await notificationApplicationService.deleteNotification(uuid);
      const notification = state.notifications.find(n => n.uuid === uuid);
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.filter(n => n.uuid !== uuid),
        unreadCount: notification && !notification.isRead
          ? Math.max(0, prev.unreadCount - 1)
          : prev.unreadCount,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '删除通知失败',
      }));
    }
  }, [state.notifications]);

  /**
   * 批量删除通知
   */
  const batchDeleteNotifications = useCallback(async (uuids: string[]) => {
    try {
      await notificationApplicationService.batchDeleteNotifications(uuids);
      const unreadDeleted = state.notifications.filter(
        n => uuids.includes(n.uuid) && !n.isRead
      ).length;
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.filter(n => !uuids.includes(n.uuid)),
        unreadCount: Math.max(0, prev.unreadCount - unreadDeleted),
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '批量删除通知失败',
      }));
    }
  }, [state.notifications]);

  /**
   * 刷新全部
   */
  const refreshAll = useCallback(async () => {
    await Promise.all([loadNotifications(), loadUnreadCount()]);
  }, [loadNotifications, loadUnreadCount]);

  // 初始加载未读数量
  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount]);

  return {
    ...state,
    loadNotifications,
    loadUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    batchDeleteNotifications,
    refreshAll,
  };
}
