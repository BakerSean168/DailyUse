/**
 * Account Module Exports
 * 账户模块 - 显式导出
 */

// ============ Enums ============
export {
  AccountStatus,
  Gender,
  ThemeType,
  ProfileVisibility,
  SubscriptionPlan,
  SubscriptionStatus,
  BillingCycle,
  StorageQuotaType,
} from './enums';

// ============ Aggregates ============
export type {
  AccountServerDTO,
  AccountPersistenceDTO,
  AccountServer,
  AccountServerStatic,
} from './aggregates/AccountServer';

export type {
  AccountClientDTO,
  AccountClient,
  AccountClientStatic,
} from './aggregates/AccountClient';

// ============ Entities ============
export type {
  SubscriptionServerDTO,
  SubscriptionPersistenceDTO,
  SubscriptionServer,
  SubscriptionServerStatic,
} from './entities/SubscriptionServer';

export type {
  SubscriptionClientDTO,
  SubscriptionClient,
  SubscriptionClientStatic,
} from './entities/SubscriptionClient';

export type {
  AccountHistoryServerDTO,
  AccountHistoryPersistenceDTO,
  AccountHistoryServer,
  AccountHistoryServerStatic,
} from './entities/AccountHistoryServer';

export type {
  AccountHistoryClientDTO,
  AccountHistoryClient,
  AccountHistoryClientStatic,
} from './entities/AccountHistoryClient';

// ============ API Requests/Responses ============
export type {
  AccountDTO,
  AccountListResponseDTO,
  SubscriptionDTO,
  AccountHistoryListResponseDTO,
  CreateAccountRequestDTO,
  UpdateAccountProfileRequestDTO,
  UpdateAccountPreferencesRequestDTO,
  UpdateEmailRequestDTO,
  VerifyEmailRequestDTO,
  UpdatePhoneRequestDTO,
  VerifyPhoneRequestDTO,
  SubscribePlanRequestDTO,
  CancelSubscriptionRequestDTO,
  AccountQueryParams,
  AccountStatsResponseDTO,
} from './api-requests';
