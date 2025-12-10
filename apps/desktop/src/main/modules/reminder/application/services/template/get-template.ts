/**
 * Get Reminder Template Service
 */

import { getReminderTemplate } from '@dailyuse/application-server';
import type { ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getTemplateService');

export async function getTemplateService(uuid: string): Promise<ReminderTemplateClientDTO | null> {
  logger.debug('Getting reminder template', { uuid });
  const result = await getReminderTemplate({ uuid });
  return result.template;
}
