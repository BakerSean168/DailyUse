import { createLogger } from '@dailyuse/utils';

const logger = createLogger('stopSyncService');

export async function stopSyncService(): Promise<{ success: boolean }> {
  logger.debug('Stop sync');
  return { success: true };
}
