import {
  createConversation,
  type CreateConversationOutput,
} from '@dailyuse/application-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('createConversationService');

export async function createConversationService(
  accountUuid: string,
  title?: string,
): Promise<CreateConversationOutput> {
  logger.debug('Creating conversation', { accountUuid, title });
  return createConversation({ accountUuid, title: title || 'New Conversation' });
}
