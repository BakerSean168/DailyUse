import { createLogger } from '@dailyuse/utils';

const logger = createLogger('resetSettingService');

export async function resetSettingService(key?: string): Promise<{ success: boolean }> {
  logger.debug('Reset setting', { key });
  return { success: true };
}
