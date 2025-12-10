import { createLogger } from '@dailyuse/utils';

const logger = createLogger('updateSettingService');

export async function updateSettingService(key: string, value: any): Promise<{ success: boolean }> {
  logger.debug('Update setting', { key });
  return { success: true };
}
