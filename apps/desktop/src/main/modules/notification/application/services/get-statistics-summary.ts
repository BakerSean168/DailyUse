import { getUserNotifications, getUnreadCount } from '@dailyuse/application-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getStatisticsSummaryService');

export async function getStatisticsSummaryService(accountUuid: string): Promise<{
  total: number;
  unread: number;
  read: number;
}> {
  const unreadCount = await getUnreadCount(accountUuid);
  const notifications = await getUserNotifications(accountUuid, { includeRead: true });
  const readCount = notifications.filter((n) => n.readAt).length;

  return {
    total: notifications.length,
    unread: unreadCount,
    read: readCount,
  };
}
