import { createLogger } from '@dailyuse/utils';

const logger = createLogger('retryGenerationTaskService');

export async function retryGenerationTaskService(
  accountUuid: string,
  taskUuid: string,
): Promise<{ success: boolean }> {
  logger.debug('Retrying generation task', { accountUuid, taskUuid });
  return { success: true };
}
