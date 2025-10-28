/**
 * useAccount Composable
 * 账户 Composable 函数 - 纯数据传递层
 *
 * 职责：
 * - 封装 Store 的响应式状态
 * - 调用 ApplicationService 执行业务逻辑
 * - 不包含复杂的业务规则
 */

import { computed } from 'vue';
import { useAccountStore } from '../stores/accountStore';
import {
  accountProfileApplicationService,
  accountSubscriptionApplicationService,
} from '../../application/services';
import type { AccountContracts } from '@dailyuse/contracts';

export function useAccount() {
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
   * 获取账户详情
   */
  async function getAccountById(accountId: string): Promise<AccountContracts.AccountDTO> {
    return await accountProfileApplicationService.getAccountById(accountId);
  }

  /**
   * 更新账户资料
   */
  async function updateProfile(
    accountId: string,
    request: AccountContracts.UpdateAccountProfileRequestDTO,
  ): Promise<AccountContracts.AccountDTO> {
    return await accountProfileApplicationService.updateProfile(accountId, request);
  }

  /**
   * 更新账户偏好
   */
  async function updatePreferences(
    accountId: string,
    request: AccountContracts.UpdateAccountPreferencesRequestDTO,
  ): Promise<AccountContracts.AccountDTO> {
    return await accountProfileApplicationService.updatePreferences(accountId, request);
  }

  // ===== 邮箱和手机号管理 =====

  /**
   * 更新邮箱
   */
  async function updateEmail(
    accountId: string,
    request: AccountContracts.UpdateEmailRequestDTO,
  ): Promise<AccountContracts.AccountDTO> {
    return await accountProfileApplicationService.updateEmail(accountId, request);
  }

  /**
   * 验证邮箱
   */
  async function verifyEmail(
    accountId: string,
    request: AccountContracts.VerifyEmailRequestDTO,
  ): Promise<AccountContracts.AccountDTO> {
    return await accountProfileApplicationService.verifyEmail(accountId, request);
  }

  /**
   * 更新手机号
   */
  async function updatePhone(
    accountId: string,
    request: AccountContracts.UpdatePhoneRequestDTO,
  ): Promise<AccountContracts.AccountDTO> {
    return await accountProfileApplicationService.updatePhone(accountId, request);
  }

  /**
   * 验证手机号
   */
  async function verifyPhone(
    accountId: string,
    request: AccountContracts.VerifyPhoneRequestDTO,
  ): Promise<AccountContracts.AccountDTO> {
    return await accountProfileApplicationService.verifyPhone(accountId, request);
  }

  // ===== 账户状态管理 =====

  /**
   * 停用账户
   */
  async function deactivateAccount(accountId: string): Promise<AccountContracts.AccountDTO> {
    return await accountProfileApplicationService.deactivateAccount(accountId);
  }

  /**
   * 激活账户
   */
  async function activateAccount(accountId: string): Promise<AccountContracts.AccountDTO> {
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
  async function getSubscription(accountId: string): Promise<AccountContracts.SubscriptionDTO> {
    return await accountSubscriptionApplicationService.getSubscription(accountId);
  }

  /**
   * 订阅计划
   */
  async function subscribePlan(
    accountId: string,
    request: AccountContracts.SubscribePlanRequestDTO,
  ): Promise<AccountContracts.SubscriptionDTO> {
    return await accountSubscriptionApplicationService.subscribePlan(accountId, request);
  }

  /**
   * 取消订阅
   */
  async function cancelSubscription(
    accountId: string,
    request?: AccountContracts.CancelSubscriptionRequestDTO,
  ): Promise<AccountContracts.SubscriptionDTO> {
    return await accountSubscriptionApplicationService.cancelSubscription(accountId, request);
  }

  // ===== 账户历史和统计 =====

  /**
   * 获取账户历史
   */
  async function getAccountHistory(
    accountId: string,
    params?: { page?: number; limit?: number },
  ): Promise<AccountContracts.AccountHistoryListResponseDTO> {
    return await accountProfileApplicationService.getAccountHistory(accountId, params);
  }

  /**
   * 获取账户统计
   */
  async function getAccountStats(): Promise<AccountContracts.AccountStatsResponseDTO> {
    return await accountSubscriptionApplicationService.getAccountStats();
  }

  // ===== Store 操作 =====

  /**
   * 设置当前账户
   */
  function setCurrentAccount(account: AccountContracts.AccountDTO | null) {
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
