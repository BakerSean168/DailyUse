/**
 * Create Reminder Template Service
 */

import {
  createReminderTemplate,
  type CreateReminderTemplateInput,
} from '@dailyuse/application-server';
import type { ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('createTemplateService');

export async function createTemplateService(
  input: CreateReminderTemplateInput,
): Promise<ReminderTemplateClientDTO> {
  logger.debug('Creating reminder template', { title: input.title });
  const result = await createReminderTemplate(input);
  return result.template;
}
