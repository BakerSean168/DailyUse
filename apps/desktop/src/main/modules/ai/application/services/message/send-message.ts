import {
  sendMessage,
  type SendMessageOutput,
} from '@dailyuse/application-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('sendMessageService');

export async function sendMessageService(
  accountUuid: string,
  conversationUuid: string,
  content: string,
): Promise<SendMessageOutput> {
  logger.debug('Sending message', { accountUuid, conversationUuid });
  return sendMessage({ accountUuid, conversationUuid, content });
}
