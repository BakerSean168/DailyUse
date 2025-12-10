import { createLogger } from '@dailyuse/utils';

const logger = createLogger('setLanguageService');

export async function setLanguageService(language: string): Promise<{ success: boolean }> {
  logger.debug('Set language', { language });
  return { success: true };
}
