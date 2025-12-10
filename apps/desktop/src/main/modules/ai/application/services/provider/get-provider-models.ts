import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getProviderModelsService');

export async function getProviderModelsService(
  accountUuid: string,
  providerId: string,
): Promise<{ models: any[] }> {
  logger.debug('Getting provider models', { accountUuid, providerId });
  // TODO: Implement getProviderModels
  return { models: [] };
}
