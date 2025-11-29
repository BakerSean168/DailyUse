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
  CreateAccountRequest,
  UpdateAccountProfileRequest,
  UpdateAccountPreferencesRequest,
  UpdateEmailRequest,
  VerifyEmailRequest,
  UpdatePhoneRequest,
  VerifyPhoneRequest,
  SubscribePlanRequest,
  CancelSubscriptionRequest,
  AccountQueryParams,
  AccountStatsResponseDTO,
} from './api-requests';

// ============ DTO Aliases (for backward compatibility) ============
// Web 应用使用 *RequestDTO 命名，提供别名兼容
export type { CreateAccountRequest as CreateAccountRequestDTO } from './api-requests';
export type { UpdateAccountProfileRequest as UpdateAccountProfileRequestDTO } from './api-requests';
export type { UpdateAccountPreferencesRequest as UpdateAccountPreferencesRequestDTO } from './api-requests';
export type { UpdateEmailRequest as UpdateEmailRequestDTO } from './api-requests';
export type { VerifyEmailRequest as VerifyEmailRequestDTO } from './api-requests';
export type { UpdatePhoneRequest as UpdatePhoneRequestDTO } from './api-requests';
export type { VerifyPhoneRequest as VerifyPhoneRequestDTO } from './api-requests';
export type { SubscribePlanRequest as SubscribePlanRequestDTO } from './api-requests';
export type { CancelSubscriptionRequest as CancelSubscriptionRequestDTO } from './api-requests';
