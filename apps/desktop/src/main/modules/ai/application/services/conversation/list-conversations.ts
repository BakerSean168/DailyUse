import {
  listConversations,
  type ListConversationsOutput,
} from '@dailyuse/application-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('listConversationsService');

export async function listConversationsService(
  accountUuid: string,
  options?: { limit?: number; offset?: number; archived?: boolean },
): Promise<ListConversationsOutput> {
  logger.debug('Listing conversations', { accountUuid, options });
  return listConversations({
    accountUuid,
    ...options,
  });
}
