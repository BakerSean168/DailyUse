import {
  getConversation,
  type GetConversationOutput,
} from '@dailyuse/application-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getConversationService');

export async function getConversationService(
  accountUuid: string,
  conversationUuid: string,
  includeMessages = false,
): Promise<GetConversationOutput> {
  logger.debug('Getting conversation', { accountUuid, conversationUuid });
  return getConversation({
    accountUuid,
    uuid: conversationUuid,
  });
}
