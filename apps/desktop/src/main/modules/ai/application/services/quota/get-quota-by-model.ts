import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getQuotaByModelService');

export async function getQuotaByModelService(
  accountUuid: string,
  modelId: string,
): Promise<{ used: number; limit: number }> {
  logger.debug('Getting quota by model', { accountUuid, modelId });
  // TODO: Implement getQuotaByModel
  return { used: 0, limit: 0 };
}
