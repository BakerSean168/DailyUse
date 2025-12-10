import {
  listProviders,
  type ListProvidersOutput,
} from '@dailyuse/application-server';
import type { AIProviderConfigClientDTO } from '@dailyuse/contracts/ai';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('listProvidersService');

export async function listProvidersService(
  accountUuid: string,
): Promise<ListProvidersOutput> {
  logger.debug('Listing providers', { accountUuid });
  return listProviders({ accountUuid });
}
