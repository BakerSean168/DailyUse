/**
 * Create One Time Task Use Case
 */

import { createOneTimeTask, type CreateOneTimeTaskInput } from '@dailyuse/application-server';
import type { TaskTemplateClientDTO } from '@dailyuse/contracts/task';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('CreateOneTimeTaskUseCase');

export async function createOneTimeTaskUseCase(input: CreateOneTimeTaskInput): Promise<TaskTemplateClientDTO> {
  logger.debug('Creating one-time task', { title: input.title });
  const result = await createOneTimeTask(input);
  return result.task;
}
