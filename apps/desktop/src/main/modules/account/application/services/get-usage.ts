import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getUsageService');

export interface UsageInfo {
  storage: { used: number; limit: number };
  api: { used: number; limit: number };
}

export async function getUsageService(accountUuid: string): Promise<UsageInfo> {
  logger.debug('Getting usage info', { accountUuid });
  return {
    storage: { used: 0, limit: 1024 * 1024 * 1024 }, // 1GB
    api: { used: 0, limit: 10000 },
  };
}
