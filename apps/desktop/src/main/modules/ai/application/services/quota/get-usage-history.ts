import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getUsageHistoryService');

export async function getUsageHistoryService(
  accountUuid: string,
  options?: { startDate?: Date; endDate?: Date },
): Promise<{ usages: any[]; total: number }> {
  logger.debug('Getting usage history', { accountUuid });
  // TODO: Implement getUsageHistory
  return { usages: [], total: 0 };
}
