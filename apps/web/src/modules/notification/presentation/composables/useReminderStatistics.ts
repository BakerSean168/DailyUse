/**
 * useReminderStatistics Composable
 * 提醒统计 Composable - 基于 notification 模块的数据
 */

import { computed } from 'vue';
import { useNotification } from './useNotification';

/**
 * 提醒统计 Composable
 * 从 notification composable 获取数据并提供 reminder 相关的统计
 */
export function useReminderStatistics() {
  const { notifications, unreadCount: totalUnreadCount } = useNotification();

  /**
   * 今日提醒数量
   * 筛选今天的 REMINDER 类型通知
   */
  const todayReminders = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return notifications.value.filter((notification) => {
      // 假设 notification 有 type 字段标识是否为 REMINDER
      // 如果没有，这里可以根据实际的 notification 结构调整
      const isReminder = notification.type === 'REMINDER' || notification.category === 'REMINDER';

      if (!isReminder) return false;

      const notificationDate = new Date(notification.createdAt);
      return notificationDate >= today && notificationDate < tomorrow;
    }).length;
  });

  /**
   * 未读提醒数量
   * 筛选未读的 REMINDER 类型通知
   */
  const unreadReminders = computed(() => {
    return notifications.value.filter((notification) => {
      const isReminder = notification.type === 'REMINDER' || notification.category === 'REMINDER';
      return isReminder && !notification.isRead;
    }).length;
  });

  /**
   * 全部提醒数量
   */
  const totalReminders = computed(() => {
    return notifications.value.filter((notification) => {
      return notification.type === 'REMINDER' || notification.category === 'REMINDER';
    }).length;
  });

  return {
    todayReminders,
    unreadReminders,
    totalReminders,
  };
}
