import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getSyncConflictsService');

export async function getSyncConflictsService(): Promise<{ conflicts: []; total: 0 }> {
  logger.debug('Get sync conflicts');
  return { conflicts: [], total: 0 };
}
