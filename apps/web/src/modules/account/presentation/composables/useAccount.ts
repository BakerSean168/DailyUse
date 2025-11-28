/**
 * useAccount Composable
 * 账户 Composable 函数 - 纯数据传递层
 *
 * 职责：
 * - 封装 Store 的响应式状态
 * - 调用 ApplicationService 执行业务逻辑
 * - 不包含复杂的业务规则
 */

import { computed, type ComputedRef } from 'vue';
import { useAccountStore } from '../stores/accountStore';
import {
  accountProfileApplicationService,
  accountSubscriptionApplicationService,
} from '../../application/services';
import type { AccountClientDTO, UpdateAccountRequest } from '@dailyuse/contracts/account';

// 本地类型别名
type AccountDTO = AccountDTO;
type SubscriptionDTO = SubscriptionDTO;
type AccountHistoryDTO = AccountHistoryServerDTO;
type AccountStatsDTO = AccountStatsResponseDTO;

// 返回类型接口（无需导出，web 应用不生成 .d.ts）
interface UseAccountReturn {
  // 响应式状态
  currentAccount: ComputedRef<AccountDTO | null>;
  subscription: ComputedRef<SubscriptionDTO | null>;
  accountHistory: ComputedRef<AccountHistoryDTO[]>;
  accountStats: ComputedRef<AccountStatsDTO | null>;
  isLoading: ComputedRef<boolean>;
  error: ComputedRef<string | null>;
  savedAccounts: ComputedRef<AccountDTO[]>;

  // 计算属性
  isAuthenticated: ComputedRef<boolean>;
  currentAccountUuid: ComputedRef<string | null>;
  accountStatus: ComputedRef<AccountStatus | null>;
  isActiveAccount: ComputedRef<boolean>;
  isDeactivatedAccount: ComputedRef<boolean>;
  isSuspendedAccount: ComputedRef<boolean>;
  isDeletedAccount: ComputedRef<boolean>;
  isEmailVerified: ComputedRef<boolean>;
  isPhoneVerified: ComputedRef<boolean>;
  isTwoFactorEnabled: ComputedRef<boolean>;
  currentSubscriptionPlan: ComputedRef<SubscriptionPlan | null>;
  isPremiumUser: ComputedRef<boolean>;
  storageUsagePercentage: ComputedRef<number>;
  rememberedAccounts: ComputedRef<AccountDTO[]>;

  // 方法
  updateProfile: (data: UpdateAccountProfileRequestDTO) => Promise<boolean>;
  updateEmail: (newEmail: string, password: string) => Promise<boolean>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  updateAvatar: (avatarUrl: string) => Promise<boolean>;
  deactivateAccount: (reason?: string) => Promise<boolean>;
  loadCurrentAccount: () => Promise<boolean>;
  updateSubscription: (
    plan: SubscriptionPlan,
    cycle?: BillingCycle,
  ) => Promise<boolean>;
  cancelSubscription: (reason?: string) => Promise<boolean>;
  loadSubscription: () => Promise<boolean>;
  loadAccountHistory: (limit?: number) => Promise<boolean>;
  loadAccountStats: () => Promise<boolean>;
  addSavedAccount: (account: AccountDTO) => void;
  removeSavedAccount: (accountUuid: string) => void;
  clearSavedAccounts: () => void;
  clearError: () => void;
}

export function useAccount(): UseAccountReturn {
  const accountStore = useAccountStore();

  // ===== 响应式状态 =====

  const currentAccount = computed(() => accountStore.currentAccount);
  const subscription = computed(() => accountStore.subscription);
  const accountHistory = computed(() => accountStore.accountHistory);
  const accountStats = computed(() => accountStore.accountStats);
  const isLoading = computed(() => accountStore.isLoading);
  const error = computed(() => accountStore.error);
  const savedAccounts = computed(() => accountStore.savedAccounts);

  // ===== 计算属性 =====

  const isAuthenticated = computed(() => accountStore.isAuthenticated);
  const currentAccountUuid = computed(() => accountStore.currentAccountUuid);
  const accountStatus = computed(() => accountStore.accountStatus);
  const isActiveAccount = computed(() => accountStore.isActiveAccount);
  const isDeactivatedAccount = computed(() => accountStore.isDeactivatedAccount);
  const isSuspendedAccount = computed(() => accountStore.isSuspendedAccount);
  const isDeletedAccount = computed(() => accountStore.isDeletedAccount);
  const isEmailVerified = computed(() => accountStore.isEmailVerified);
  const isPhoneVerified = computed(() => accountStore.isPhoneVerified);
  const isTwoFactorEnabled = computed(() => accountStore.isTwoFactorEnabled);
  const currentSubscriptionPlan = computed(() => accountStore.currentSubscriptionPlan);
  const isPremiumUser = computed(() => accountStore.isPremiumUser);
  const storageUsagePercentage = computed(() => accountStore.storageUsagePercentage);
  const rememberedAccounts = computed(() => accountStore.rememberedAccounts);

  // ===== 账户资料管理 =====

  /**
   * 获取当前用户资料
   */
  async function getMyProfile(): Promise<AccountDTO> {
    return await accountProfileApplicationService.getMyProfile();
  }

  /**
   * 更新当前用户资料
   */
  async function updateMyProfile(
    request: UpdateAccountProfileRequestDTO,
  ): Promise<AccountDTO> {
    return await accountProfileApplicationService.updateMyProfile(request);
  }

  /**
   * 修改当前用户密码
   */
  async function changeMyPassword(request: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    return await accountProfileApplicationService.changeMyPassword(request);
  }

  /**
   * 获取账户详情
   */
  async function getAccountById(accountId: string): Promise<AccountDTO> {
    return await accountProfileApplicationService.getAccountById(accountId);
  }

  /**
   * 更新账户资料
   */
  async function updateProfile(
    accountId: string,
    request: UpdateAccountProfileRequestDTO,
  ): Promise<AccountDTO> {
    return await accountProfileApplicationService.updateProfile(accountId, request);
  }

  /**
   * 更新账户偏好
   */
  async function updatePreferences(
    accountId: string,
    request: UpdateAccountPreferencesRequestDTO,
  ): Promise<AccountDTO> {
    return await accountProfileApplicationService.updatePreferences(accountId, request);
  }

  // ===== 邮箱和手机号管理 =====

  /**
   * 更新邮箱
   */
  async function updateEmail(
    accountId: string,
    request: UpdateEmailRequestDTO,
  ): Promise<AccountDTO> {
    return await accountProfileApplicationService.updateEmail(accountId, request);
  }

  /**
   * 验证邮箱
   */
  async function verifyEmail(
    accountId: string,
    request: VerifyEmailRequestDTO,
  ): Promise<AccountDTO> {
    return await accountProfileApplicationService.verifyEmail(accountId, request);
  }

  /**
   * 更新手机号
   */
  async function updatePhone(
    accountId: string,
    request: UpdatePhoneRequestDTO,
  ): Promise<AccountDTO> {
    return await accountProfileApplicationService.updatePhone(accountId, request);
  }

  /**
   * 验证手机号
   */
  async function verifyPhone(
    accountId: string,
    request: VerifyPhoneRequestDTO,
  ): Promise<AccountDTO> {
    return await accountProfileApplicationService.verifyPhone(accountId, request);
  }

  // ===== 账户状态管理 =====

  /**
   * 停用账户
   */
  async function deactivateAccount(accountId: string): Promise<AccountDTO> {
    return await accountProfileApplicationService.deactivateAccount(accountId);
  }

  /**
   * 激活账户
   */
  async function activateAccount(accountId: string): Promise<AccountDTO> {
    return await accountProfileApplicationService.activateAccount(accountId);
  }

  /**
   * 删除账户
   */
  async function deleteAccount(accountId: string): Promise<void> {
    await accountProfileApplicationService.deleteAccount(accountId);
  }

  // ===== 订阅管理 =====

  /**
   * 获取订阅信息
   */
  async function getSubscription(accountId: string): Promise<SubscriptionDTO> {
    return await accountSubscriptionApplicationService.getSubscription(accountId);
  }

  /**
   * 订阅计划
   */
  async function subscribePlan(
    accountId: string,
    request: SubscribePlanRequestDTO,
  ): Promise<SubscriptionDTO> {
    return await accountSubscriptionApplicationService.subscribePlan(accountId, request);
  }

  /**
   * 取消订阅
   */
  async function cancelSubscription(
    accountId: string,
    request?: CancelSubscriptionRequestDTO,
  ): Promise<SubscriptionDTO> {
    return await accountSubscriptionApplicationService.cancelSubscription(accountId, request);
  }

  // ===== 账户历史和统计 =====

  /**
   * 获取账户历史
   */
  async function getAccountHistory(
    accountId: string,
    params?: { page?: number; limit?: number },
  ): Promise<AccountHistoryListResponseDTO> {
    return await accountProfileApplicationService.getAccountHistory(accountId, params);
  }

  /**
   * 获取账户统计
   */
  async function getAccountStats(): Promise<AccountStatsResponseDTO> {
    return await accountSubscriptionApplicationService.getAccountStats();
  }

  // ===== Store 操作 =====

  /**
   * 设置当前账户
   */
  function setCurrentAccount(account: AccountDTO | null) {
    accountStore.setCurrentAccount(account);
  }

  /**
   * 清除当前账户
   */
  function clearCurrentAccount() {
    accountStore.clearCurrentAccount();
  }

  /**
   * 从存储恢复
   */
  function restoreFromStorage() {
    accountStore.restoreFromStorage();
  }

  /**
   * 清除所有数据
   */
  function clearAll() {
    accountStore.clearAll();
  }

  // ===== 返回 =====

  return {
    // 状态
    currentAccount,
    subscription,
    accountHistory,
    accountStats,
    isLoading,
    error,
    savedAccounts,

    // 计算属性
    isAuthenticated,
    currentAccountUuid,
    accountStatus,
    isActiveAccount,
    isDeactivatedAccount,
    isSuspendedAccount,
    isDeletedAccount,
    isEmailVerified,
    isPhoneVerified,
    isTwoFactorEnabled,
    currentSubscriptionPlan,
    isPremiumUser,
    storageUsagePercentage,
    rememberedAccounts,

    // 当前用户资料方法 (/me)
    getMyProfile,
    updateMyProfile,
    changeMyPassword,

    // 账户资料方法
    getAccountById,
    updateProfile,
    updatePreferences,

    // 邮箱和手机号方法
    updateEmail,
    verifyEmail,
    updatePhone,
    verifyPhone,

    // 状态管理方法
    deactivateAccount,
    activateAccount,
    deleteAccount,

    // 订阅方法
    getSubscription,
    subscribePlan,
    cancelSubscription,

    // 历史和统计
    getAccountHistory,
    getAccountStats,

    // Store 操作
    setCurrentAccount,
    clearCurrentAccount,
    restoreFromStorage,
    clearAll,
  };
}

