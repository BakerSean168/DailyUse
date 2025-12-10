import { createLogger } from '@dailyuse/utils';

const logger = createLogger('deleteMessageService');

export async function deleteMessageService(
  accountUuid: string,
  messageUuid: string,
): Promise<{ success: boolean }> {
  logger.debug('Deleting message', { accountUuid, messageUuid });
  // TODO: Implement deleteMessage
  return { success: true };
}
