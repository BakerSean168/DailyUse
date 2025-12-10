import { createLogger } from '@dailyuse/utils';

const logger = createLogger('cancelGenerationTaskService');

export async function cancelGenerationTaskService(
  accountUuid: string,
  taskUuid: string,
): Promise<{ success: boolean }> {
  logger.debug('Cancelling generation task', { accountUuid, taskUuid });
  return { success: true };
}
