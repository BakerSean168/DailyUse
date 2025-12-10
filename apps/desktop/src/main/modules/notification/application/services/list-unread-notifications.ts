import { getUnreadNotifications } from '@dailyuse/application-server';
import type { NotificationClientDTO } from '@dailyuse/contracts/notification';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('listUnreadNotificationsService');

export async function listUnreadNotificationsService(
  accountUuid: string,
  limit?: number,
): Promise<NotificationClientDTO[]> {
  return getUnreadNotifications(accountUuid, { limit });
}
