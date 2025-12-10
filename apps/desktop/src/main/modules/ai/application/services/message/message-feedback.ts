import { createLogger } from '@dailyuse/utils';

const logger = createLogger('messageFeedbackService');

export async function messageFeedbackService(
  accountUuid: string,
  messageUuid: string,
  feedback: 'positive' | 'negative',
): Promise<{ success: boolean }> {
  logger.debug('Message feedback', { accountUuid, messageUuid, feedback });
  // TODO: Implement messageFeedback
  return { success: true };
}
