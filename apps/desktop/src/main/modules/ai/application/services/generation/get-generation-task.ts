import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getGenerationTaskService');

export async function getGenerationTaskService(
  accountUuid: string,
  taskUuid: string,
): Promise<any | null> {
  logger.debug('Getting generation task', { accountUuid, taskUuid });
  return null;
}
