import { getAccountProfile } from '@dailyuse/application-server';
import type { GetAccountProfileOutput } from '@dailyuse/application-server';
import type { AccountClientDTO } from '@dailyuse/contracts/account';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getProfileService');

export async function getProfileService(accountUuid: string): Promise<AccountClientDTO> {
  logger.debug('Getting account profile', { accountUuid });
  const result = await getAccountProfile({ accountUuid });
  return result.profile;
}
