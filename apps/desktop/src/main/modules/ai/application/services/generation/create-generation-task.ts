import { createLogger } from '@dailyuse/utils';

const logger = createLogger('createGenerationTaskService');

export async function createGenerationTaskService(
  accountUuid: string,
  request: { type: string; input: any },
): Promise<{ uuid: string; status: string }> {
  logger.debug('Creating generation task', { accountUuid, type: request.type });
  // TODO: Implement generation task management
  return { uuid: 'todo', status: 'pending' };
}
