import { createLogger } from '@dailyuse/utils';

const logger = createLogger('regenerateMessageService');

export async function regenerateMessageService(
  accountUuid: string,
  messageUuid: string,
): Promise<{ uuid: string }> {
  logger.debug('Regenerating message', { accountUuid, messageUuid });
  // TODO: Implement regenerateMessage
  return { uuid: 'new-uuid' };
}
