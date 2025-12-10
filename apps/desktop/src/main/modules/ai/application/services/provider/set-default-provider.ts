import { createLogger } from '@dailyuse/utils';

const logger = createLogger('setDefaultProviderService');

export async function setDefaultProviderService(
  accountUuid: string,
  providerId: string,
): Promise<{ success: boolean }> {
  logger.debug('Setting default provider', { accountUuid, providerId });
  // TODO: Implement setDefaultProvider
  return { success: true };
}
