/**
 * Account Application Module (Client)
 *
 * 账户模块 - 负责账户资料、偏好和订阅管理
 */

// Container
export { AccountContainer } from '@dailyuse/infrastructure-client';

// Services - All exports
export {
  // Events
  AccountProfileEvents,
  AccountSubscriptionEvents,
  type AccountProfileRefreshEvent,
  type AccountSubscriptionRefreshEvent,
  
  // Profile Use Cases
  GetMyProfile,
  getMyProfile,
  UpdateMyProfile,
  updateMyProfile,
  type UpdateMyProfileInput,
  ChangeMyPassword,
  changeMyPassword,
  type ChangeMyPasswordInput,
  type ChangeMyPasswordResult,
  GetAccountById,
  getAccountById,
  UpdateAccountProfile,
  updateAccountProfile,
  type UpdateAccountProfileInput,
  UpdateAccountPreferences,
  updateAccountPreferences,
  type UpdateAccountPreferencesInput,
  UpdateEmail,
  updateEmail,
  type UpdateEmailInput,
  VerifyEmail,
  verifyEmail,
  type VerifyEmailInput,
  UpdatePhone,
  updatePhone,
  type UpdatePhoneInput,
  VerifyPhone,
  verifyPhone,
  type VerifyPhoneInput,
  DeactivateAccount,
  deactivateAccount,
  ActivateAccount,
  activateAccount,
  DeleteAccount,
  deleteAccount,
  GetAccountHistory,
  getAccountHistory,
  type GetAccountHistoryInput,
  
  // Subscription Use Cases
  GetSubscription,
  getSubscription,
  SubscribePlan,
  subscribePlan,
  type SubscribePlanInput,
  CancelSubscription,
  cancelSubscription,
  type CancelSubscriptionInput,
  GetAccountStats,
  getAccountStats,
  
  // Legacy exports (deprecated)
  AccountProfileApplicationService,
  createAccountProfileApplicationService,
  AccountSubscriptionApplicationService,
  createAccountSubscriptionApplicationService,
} from './services';
