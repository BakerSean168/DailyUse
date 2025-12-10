import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getSubscriptionService');

export interface SubscriptionInfo {
  plan: string;
  status: string;
  features: string[];
}

export async function getSubscriptionService(accountUuid: string): Promise<SubscriptionInfo> {
  logger.debug('Getting subscription info', { accountUuid });
  return {
    plan: 'free',
    status: 'active',
    features: ['basic', 'offline-mode'],
  };
}
