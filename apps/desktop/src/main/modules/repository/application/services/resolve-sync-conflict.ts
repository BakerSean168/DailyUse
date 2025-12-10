import { createLogger } from '@dailyuse/utils';

const logger = createLogger('resolveSyncConflictService');

export async function resolveSyncConflictService(
  conflictId: string,
  resolution: 'local' | 'remote' | 'merge',
): Promise<{ success: boolean }> {
  logger.debug('Resolve sync conflict', { conflictId, resolution });
  return { success: true };
}
