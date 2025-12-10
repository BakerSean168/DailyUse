import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getSingleSettingService');

export async function getSingleSettingService(key: string): Promise<any> {
  logger.debug('Get setting', { key });
  // TODO: Implement reading specific setting
  return null;
}
