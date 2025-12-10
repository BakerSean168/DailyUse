import { updateAccountProfile } from '@dailyuse/application-server';
import type {
  UpdateAccountProfileInput,
  UpdateAccountProfileOutput,
} from '@dailyuse/application-server';
import type { AccountClientDTO } from '@dailyuse/contracts/account';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('updateProfileService');

export async function updateProfileService(
  accountUuid: string,
  input: Omit<UpdateAccountProfileInput, 'accountUuid'>,
): Promise<AccountClientDTO> {
  logger.debug('Updating account profile', { accountUuid });
  const result = await updateAccountProfile({ accountUuid, ...input });
  return result.profile;
}
