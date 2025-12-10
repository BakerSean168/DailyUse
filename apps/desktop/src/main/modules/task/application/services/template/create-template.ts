/**
 * Create Task Template Use Case
 */

import { createTaskTemplate, type CreateTaskTemplateInput } from '@dailyuse/application-server';
import type { TaskTemplateClientDTO } from '@dailyuse/contracts/task';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('CreateTemplateUseCase');

export async function createTemplateUseCase(input: CreateTaskTemplateInput): Promise<TaskTemplateClientDTO> {
  logger.debug('Creating task template', { title: input.title });
  const result = await createTaskTemplate(input);
  return result.template;
}
