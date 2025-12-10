import { createLogger } from '@dailyuse/utils';

const logger = createLogger('forceSyncService');

export async function forceSyncService(): Promise<{ success: boolean; error?: string }> {
  logger.debug('Force sync requested');
  return { success: false, error: 'Desktop offline mode - sync not available' };
}
