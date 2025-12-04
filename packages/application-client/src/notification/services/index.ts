/**
 * Notification Module - Application Services
 */

// 用例导出
export { CreateNotification, createNotification } from './create-notification';
export type { CreateNotificationInput } from './create-notification';

export { FindNotifications, findNotifications } from './find-notifications';
export type { FindNotificationsInput } from './find-notifications';

export { FindNotificationByUuid, findNotificationByUuid } from './find-notification-by-uuid';

export { MarkAsRead, markAsRead } from './mark-as-read';

export { MarkAllAsRead, markAllAsRead } from './mark-all-as-read';
export type { MarkAllAsReadOutput } from './mark-all-as-read';

export { DeleteNotification, deleteNotification } from './delete-notification';
export type { DeleteNotificationOutput } from './delete-notification';

export { BatchDeleteNotifications, batchDeleteNotifications } from './batch-delete-notifications';
export type { BatchDeleteNotificationsOutput } from './batch-delete-notifications';

export { GetUnreadCount, getUnreadCount } from './get-unread-count';
export type { GetUnreadCountOutput } from './get-unread-count';
