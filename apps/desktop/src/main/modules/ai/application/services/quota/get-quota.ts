import { getQuota, type GetQuotaOutput } from '@dailyuse/application-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getQuotaService');

export async function getQuotaService(accountUuid: string): Promise<GetQuotaOutput> {
  logger.debug('Getting quota', { accountUuid });
  return getQuota({ accountUuid });
}
