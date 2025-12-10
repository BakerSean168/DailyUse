import {
  createNotification,
  type CreateNotificationInput,
} from '@dailyuse/application-server';
import type { NotificationClientDTO } from '@dailyuse/contracts/notification';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('createNotificationService');

export async function createNotificationService(
  input: CreateNotificationInput,
): Promise<NotificationClientDTO> {
  logger.debug('Creating notification', { title: input.title });
  return createNotification(input);
}
