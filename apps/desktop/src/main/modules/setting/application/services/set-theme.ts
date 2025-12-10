import { createLogger } from '@dailyuse/utils';

const logger = createLogger('setThemeService');

export async function setThemeService(theme: 'light' | 'dark' | 'system'): Promise<{ success: boolean }> {
  logger.debug('Set theme', { theme });
  return { success: true };
}
