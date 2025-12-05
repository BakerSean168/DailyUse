/**
 * Account Application Services
 *
 * Named exports for all account-related application services.
 */

// Container
export { AccountContainer } from '@dailyuse/infrastructure-client';

// Events
export {
  AccountProfileEvents,
  AccountSubscriptionEvents,
  type AccountProfileRefreshEvent,
  type AccountSubscriptionRefreshEvent,
} from './account-events';

// ===== Profile Use Cases =====

// Get My Profile
export { GetMyProfile, getMyProfile } from './get-my-profile';

// Update My Profile
export {
  UpdateMyProfile,
  updateMyProfile,
  type UpdateMyProfileInput,
} from './update-my-profile';

// Change My Password
export {
  ChangeMyPassword,
  changeMyPassword,
  type ChangeMyPasswordInput,
  type ChangeMyPasswordResult,
} from './change-my-password';

// Get Account By Id
export { GetAccountById, getAccountById } from './get-account-by-id';

// Update Account Profile
export {
  UpdateAccountProfile,
  updateAccountProfile,
  type UpdateAccountProfileInput,
} from './update-account-profile';

// Update Account Preferences
export {
  UpdateAccountPreferences,
  updateAccountPreferences,
  type UpdateAccountPreferencesInput,
} from './update-account-preferences';

// Update Email
export {
  UpdateEmail,
  updateEmail,
  type UpdateEmailInput,
} from './update-email';

// Verify Email
export {
  VerifyEmail,
  verifyEmail,
  type VerifyEmailInput,
} from './verify-email';

// Update Phone
export {
  UpdatePhone,
  updatePhone,
  type UpdatePhoneInput,
} from './update-phone';

// Verify Phone
export {
  VerifyPhone,
  verifyPhone,
  type VerifyPhoneInput,
} from './verify-phone';

// Deactivate Account
export { DeactivateAccount, deactivateAccount } from './deactivate-account';

// Activate Account
export { ActivateAccount, activateAccount } from './activate-account';

// Delete Account
export { DeleteAccount, deleteAccount } from './delete-account';

// Get Account History
export {
  GetAccountHistory,
  getAccountHistory,
  type GetAccountHistoryInput,
} from './get-account-history';

// ===== Subscription Use Cases =====

// Get Subscription
export { GetSubscription, getSubscription } from './get-subscription';

// Subscribe Plan
export {
  SubscribePlan,
  subscribePlan,
  type SubscribePlanInput,
} from './subscribe-plan';

// Cancel Subscription
export {
  CancelSubscription,
  cancelSubscription,
  type CancelSubscriptionInput,
} from './cancel-subscription';

// Get Account Stats
export { GetAccountStats, getAccountStats } from './get-account-stats';

// ===== Legacy exports for backward compatibility (deprecated) =====

export {
  AccountProfileApplicationService,
  createAccountProfileApplicationService,
} from './AccountProfileApplicationService';

export {
  AccountSubscriptionApplicationService,
  createAccountSubscriptionApplicationService,
} from './AccountSubscriptionApplicationService';
