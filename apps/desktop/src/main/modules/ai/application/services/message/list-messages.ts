import { getConversation } from '@dailyuse/application-server';
import type { MessageClientDTO } from '@dailyuse/contracts/ai';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('listMessagesService');

export async function listMessagesService(
  accountUuid: string,
  conversationUuid: string,
  options?: { limit?: number; offset?: number },
): Promise<{ messages: MessageClientDTO[]; total: number }> {
  logger.debug('Listing messages', { accountUuid, conversationUuid });
  // Get conversation with messages
  const result = await getConversation({
    accountUuid,
    uuid: conversationUuid,
  });
  const messages = result.conversation?.messages || [];
  return { messages, total: messages.length };
}
