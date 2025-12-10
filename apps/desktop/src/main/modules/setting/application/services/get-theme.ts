import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getThemeService');

export async function getThemeService(): Promise<'light' | 'dark' | 'system'> {
  logger.debug('Get theme');
  return 'system';
}
