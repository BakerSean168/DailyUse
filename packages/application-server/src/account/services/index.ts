/**
 * Account Services Index
 *
 * 导出所有 Account 模块的 Use Case
 */

export {
  RegisterAccount,
  registerAccount,
  type RegisterAccountInput,
  type RegisterAccountOutput,
} from './register-account';

export {
  GetAccountProfile,
  getAccountProfile,
  type GetAccountProfileInput,
  type GetAccountProfileOutput,
} from './get-account-profile';

export {
  UpdateAccountProfile,
  updateAccountProfile,
  type UpdateAccountProfileInput,
  type UpdateAccountProfileOutput,
} from './update-account-profile';
