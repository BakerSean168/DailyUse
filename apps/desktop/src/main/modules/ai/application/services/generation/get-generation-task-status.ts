import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getGenerationTaskStatusService');

export async function getGenerationTaskStatusService(
  accountUuid: string,
  taskUuid: string,
): Promise<{ status: string; progress: number }> {
  logger.debug('Getting generation task status', { accountUuid, taskUuid });
  return { status: 'unknown', progress: 0 };
}
