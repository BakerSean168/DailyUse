import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getLanguageService');

export async function getLanguageService(): Promise<string> {
  logger.debug('Get language');
  return 'zh-CN';
}
