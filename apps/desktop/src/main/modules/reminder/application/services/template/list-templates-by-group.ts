/**
 * List Reminder Templates By Group Service
 */

import { listReminderTemplates } from '@dailyuse/application-server';
import type { ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('listTemplatesByGroupService');

export async function listTemplatesByGroupService(
  groupUuid: string,
  accountUuid: string,
): Promise<{
  templates: ReminderTemplateClientDTO[];
  total: number;
}> {
  logger.debug('Listing reminder templates by group', { groupUuid, accountUuid });
  const result = await listReminderTemplates({ accountUuid, groupUuid });
  return {
    templates: result.templates,
    total: result.total,
  };
}
