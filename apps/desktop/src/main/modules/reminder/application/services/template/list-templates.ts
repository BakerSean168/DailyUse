/**
 * List Reminder Templates Service
 */

import {
  listReminderTemplates,
  type ListReminderTemplatesInput,
} from '@dailyuse/application-server';
import type { ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('listTemplatesService');

export async function listTemplatesService(
  params: ListReminderTemplatesInput,
): Promise<{
  templates: ReminderTemplateClientDTO[];
  total: number;
}> {
  logger.debug('Listing reminder templates', { params });
  const result = await listReminderTemplates(params);
  return {
    templates: result.templates,
    total: result.total,
  };
}
