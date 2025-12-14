/**
 * NotificationListView Component
 *
 * 通知列表页面
 * Story-010: Notification Module
 */

import { useEffect, useCallback } from 'react';
import { useNotification } from '../hooks/useNotification';
import { NotificationItem, NotificationFilter, NotificationBadge } from '../components';

export function NotificationListView() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    hasMore,
    filter,
    loadNotifications,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    setFilter,
  } = useNotification();

  // 初始加载
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // 过滤器处理
  const handleTypeChange = useCallback(
    (type: string | undefined) => {
      setFilter({ type });
    },
    [setFilter]
  );

  const handleReadStatusChange = useCallback(
    (isRead: boolean | undefined) => {
      setFilter({ isRead });
    },
    [setFilter]
  );

  const handleClearFilters = useCallback(() => {
    setFilter({ type: undefined, isRead: undefined });
  }, [setFilter]);

  // 全部标记为已读
  const handleMarkAllAsRead = useCallback(async () => {
    if (unreadCount > 0) {
      await markAllAsRead();
    }
  }, [unreadCount, markAllAsRead]);

  // 渲染加载状态
  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">加载通知中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 标题区域 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">通知中心</h1>
          <NotificationBadge count={unreadCount} />
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
          >
            全部标记为已读
          </button>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* 过滤器 */}
      <div className="mb-6">
        <NotificationFilter
          currentType={filter.type}
          currentReadStatus={filter.isRead}
          onTypeChange={handleTypeChange}
          onReadStatusChange={handleReadStatusChange}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* 通知列表 */}
      <div className="space-y-2">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              暂无通知
            </h3>
            <p className="text-gray-600">
              {filter.type || filter.isRead !== undefined
                ? '没有符合过滤条件的通知'
                : '您的通知列表为空'}
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.uuid}
              notification={notification}
              onRead={markAsRead}
              onDelete={deleteNotification}
            />
          ))
        )}
      </div>

      {/* 加载更多 */}
      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                加载中...
              </span>
            ) : (
              '加载更多'
            )}
          </button>
        </div>
      )}

      {/* 统计信息 */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-500 text-center">
          共 {notifications.length} 条通知
          {unreadCount > 0 && `，${unreadCount} 条未读`}
        </p>
      </div>
    </div>
  );
}

export default NotificationListView;
