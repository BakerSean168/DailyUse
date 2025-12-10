import { createLogger } from '@dailyuse/utils';

const logger = createLogger('archiveConversationService');

export async function archiveConversationService(
  accountUuid: string,
  conversationUuid: string,
): Promise<{ success: boolean }> {
  logger.debug('Archiving conversation', { accountUuid, conversationUuid });
  // TODO: Implement archiveConversation
  return { success: true };
}
