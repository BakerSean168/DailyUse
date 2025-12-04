/**
 * Notification Services Index
 *
 * 导出所有 Notification 模块的 Services
 */

export {
  NotificationService,
  createNotification,
  getNotification,
  getUserNotifications,
  getUnreadNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getPreference,
  getOrCreatePreference,
  type CreateNotificationInput,
  type ChannelPreferences,
} from './notification-application';
