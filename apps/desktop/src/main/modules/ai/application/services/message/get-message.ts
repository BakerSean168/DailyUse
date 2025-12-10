import type { MessageClientDTO } from '@dailyuse/contracts/ai';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getMessageService');

export async function getMessageService(
  accountUuid: string,
  messageUuid: string,
): Promise<MessageClientDTO | null> {
  logger.debug('Getting message', { accountUuid, messageUuid });
  // TODO: Implement getMessage
  return null;
}
