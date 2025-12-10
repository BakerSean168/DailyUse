import { getPreference } from '@dailyuse/application-server';
import type { NotificationPreferenceClientDTO } from '@dailyuse/contracts/notification';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getPreferenceService');

export async function getPreferenceService(
  accountUuid: string,
): Promise<NotificationPreferenceClientDTO | null> {
  return getPreference(accountUuid);
}
