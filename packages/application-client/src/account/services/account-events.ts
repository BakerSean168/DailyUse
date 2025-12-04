/**
 * Account Events
 *
 * 账户模块事件常量
 */

export const AccountProfileEvents = {
  PROFILE_UPDATED: 'account:profile:updated',
  PASSWORD_CHANGED: 'account:password:changed',
  EMAIL_UPDATED: 'account:email:updated',
  EMAIL_VERIFIED: 'account:email:verified',
  PHONE_UPDATED: 'account:phone:updated',
  PHONE_VERIFIED: 'account:phone:verified',
  PREFERENCES_UPDATED: 'account:preferences:updated',
  ACCOUNT_DEACTIVATED: 'account:deactivated',
  ACCOUNT_ACTIVATED: 'account:activated',
  ACCOUNT_DELETED: 'account:deleted',
} as const;

export const AccountSubscriptionEvents = {
  SUBSCRIPTION_FETCHED: 'account:subscription:fetched',
  PLAN_SUBSCRIBED: 'account:plan:subscribed',
  SUBSCRIPTION_CANCELLED: 'account:subscription:cancelled',
  STATS_FETCHED: 'account:stats:fetched',
} as const;

export interface AccountProfileRefreshEvent {
  accountId: string;
  reason: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface AccountSubscriptionRefreshEvent {
  accountId: string;
  reason: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}
