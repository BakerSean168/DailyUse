/**
 * @file useAccount.ts
 * @description 账户业务逻辑组合式函数。封装了 Account Store 的状态，并提供了调用 Application Service 的业务方法，是视图层与业务逻辑层的桥梁。
 * @author Jules (AI)
 */

import { computed, type ComputedRef } from 'vue';
import { useAccountStore } from '../stores/accountStore';
import {
  accountProfileApplicationService,
  accountSubscriptionApplicationService,
} from '../../application/services';
import type {
  AccountDTO,
  SubscriptionDTO,
  AccountHistoryServerDTO,
  AccountStatsResponseDTO,
  AccountStatus,
  SubscriptionPlan,
  BillingCycle,
  UpdateAccountProfileRequestDTO,
  UpdateAccountPreferencesRequestDTO,
  UpdateEmailRequestDTO,
  VerifyEmailRequestDTO,
  UpdatePhoneRequestDTO,
  VerifyPhoneRequestDTO,
  SubscribePlanRequestDTO,
  CancelSubscriptionRequestDTO,
  AccountHistoryListResponseDTO,
} from '@dailyuse/contracts/account';

// 本地类型别名
type AccountHistoryDTO = AccountHistoryServerDTO;
type AccountStatsDTO = AccountStatsResponseDTO;

/**
 * useAccount Composable
 * 提供账户相关的响应式状态和业务方法
 */
export function useAccount() {
  const accountStore = useAccountStore();

  // ===== 响应式状态 =====

  /** 当前登录的账户信息 */
  const currentAccount = computed(() => accountStore.currentAccount);
  /** 当前订阅信息 */
  const subscription = computed(() => accountStore.subscription);
  /** 账户历史记录 */
  const accountHistory = computed(() => accountStore.accountHistory);
  /** 账户统计数据 */
  const accountStats = computed(() => accountStore.accountStats);
  /** 加载状态 */
  const isLoading = computed(() => accountStore.isLoading);
  /** 错误信息 */
  const error = computed(() => accountStore.error);
  /** 记住的账户列表 */
  const savedAccounts = computed(() => accountStore.savedAccounts);

  // ===== 计算属性 =====

  /** 是否已认证 */
  const isAuthenticated = computed(() => accountStore.isAuthenticated);
  /** 当前账户UUID */
  const currentAccountUuid = computed(() => accountStore.currentAccountUuid);
  /** 账户状态 */
  const accountStatus = computed(() => accountStore.accountStatus);
  /** 是否活跃 */
  const isActiveAccount = computed(() => accountStore.isActiveAccount);
  /** 是否已注销 */
  const isDeactivatedAccount = computed(() => accountStore.isDeactivatedAccount);
  /** 是否被冻结 */
  const isSuspendedAccount = computed(() => accountStore.isSuspendedAccount);
  /** 是否已删除 */
  const isDeletedAccount = computed(() => accountStore.isDeletedAccount);
  /** 邮箱是否验证 */
  const isEmailVerified = computed(() => accountStore.isEmailVerified);
  /** 手机是否验证 */
  const isPhoneVerified = computed(() => accountStore.isPhoneVerified);
  /** 2FA是否开启 */
  const isTwoFactorEnabled = computed(() => accountStore.isTwoFactorEnabled);
  /** 当前订阅计划 */
  const currentSubscriptionPlan = computed(() => accountStore.currentSubscriptionPlan);
  /** 是否为高级用户 */
  const isPremiumUser = computed(() => accountStore.isPremiumUser);
  /** 存储使用率 */
  const storageUsagePercentage = computed(() => accountStore.storageUsagePercentage);
  /** 记住的账户列表 */
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
