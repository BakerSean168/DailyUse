import { createLogger } from '@dailyuse/utils';

const logger = createLogger('editMessageService');

export async function editMessageService(
  accountUuid: string,
  messageUuid: string,
  content: string,
): Promise<{ success: boolean }> {
  logger.debug('Editing message', { accountUuid, messageUuid });
  // TODO: Implement editMessage
  return { success: true };
}
