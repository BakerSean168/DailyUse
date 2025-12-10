import { createLogger } from '@dailyuse/utils';

const logger = createLogger('listGenerationTasksService');

export async function listGenerationTasksService(
  accountUuid: string,
  options?: { limit?: number; offset?: number },
): Promise<{ tasks: any[]; total: number }> {
  logger.debug('Listing generation tasks', { accountUuid });
  return { tasks: [], total: 0 };
}
