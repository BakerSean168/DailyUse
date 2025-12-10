/**
 * Delete Reminder Template Service
 */

import { deleteReminderTemplate } from '@dailyuse/application-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('deleteTemplateService');

export async function deleteTemplateService(uuid: string, accountUuid: string): Promise<void> {
  logger.debug('Deleting reminder template', { uuid });
  await deleteReminderTemplate({ uuid, accountUuid });
}
