import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { AccountContracts } from '@dailyuse/contracts';

// 使用 DTO 类型（直接使用 contracts）
type AccountDTO = AccountContracts.AccountDTO;
type SubscriptionDTO = AccountContracts.SubscriptionDTO;
type AccountHistoryDTO = AccountContracts.AccountHistoryServerDTO;
type AccountStatsDTO = AccountContracts.AccountStatsResponseDTO;

// 导入枚举
const { AccountStatus, SubscriptionPlan } = AccountContracts;

/**
 * Account Store - 状态管理
 * 职责：纯数据存储和缓存管理，不执行业务逻辑
 */
export const useAccountStore = defineStore('account', () => {
  // ===== 状态 =====

  // 当前账户 (DTO 数据)
  const currentAccount = ref<AccountDTO | null>(null);

  // 订阅信息 (DTO 数据)
  const subscription = ref<SubscriptionDTO | null>(null);

  // 账户历史记录 (DTO 数据)
  const accountHistory = ref<AccountHistoryDTO[]>([]);

  // 账户统计 (DTO 数据)
  const accountStats = ref<AccountStatsDTO | null>(null);

  // UI 状态
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // 已保存的账户列表（用于记住多个账户）
  const savedAccounts = ref<AccountDTO[]>([]);

  // ===== 计算属性 =====

  /**
   * 是否已认证
   */
  const isAuthenticated = computed(() => !!currentAccount.value);

  /**
   * 当前账户 UUID
   */
  const currentAccountUuid = computed(() => currentAccount.value?.uuid ?? null);

  /**
   * 当前账户状态
   */
  const accountStatus = computed(() => currentAccount.value?.status ?? null);

  /**
   * 是否为活跃账户
   */
  const isActiveAccount = computed(
    () => currentAccount.value?.status === AccountContracts.AccountStatus.ACTIVE,
  );

  /**
   * 是否已停用
   */
  const isDeactivatedAccount = computed(
    () => currentAccount.value?.status === AccountContracts.AccountStatus.INACTIVE,
  );

  /**
   * 是否已暂停
   */
  const isSuspendedAccount = computed(
    () => currentAccount.value?.status === AccountContracts.AccountStatus.SUSPENDED,
  );

  /**
   * 是否已删除
   */
  const isDeletedAccount = computed(
    () => currentAccount.value?.status === AccountContracts.AccountStatus.DELETED,
  );

  /**
   * 是否已验证邮箱
   */
  const isEmailVerified = computed(() => currentAccount.value?.emailVerified ?? false);

  /**
   * 是否已验证手机号
   */
  const isPhoneVerified = computed(() => currentAccount.value?.phoneVerified ?? false);

  /**
   * 是否启用两步验证
   */
  const isTwoFactorEnabled = computed(
    () => currentAccount.value?.security?.twoFactorEnabled ?? false,
  );

  /**
   * 当前订阅计划
   */
  const currentSubscriptionPlan = computed(
    () => subscription.value?.plan ?? SubscriptionPlan.FREE,
  );

  /**
   * 是否为付费用户
   */
  const isPremiumUser = computed(
    () =>
      subscription.value?.plan === SubscriptionPlan.PRO ||
      subscription.value?.plan === SubscriptionPlan.ENTERPRISE,
  );

  /**
   * 存储配额使用百分比
   */
  const storageUsagePercentage = computed(() => {
    if (!currentAccount.value?.storage) return 0;
    const { used, quota } = currentAccount.value.storage;
    if (quota <= 0) return 0;
    return Math.round((used / quota) * 100);
  });

  /**
   * 已记住的账户列表
   */
  const rememberedAccounts = computed(() =>
    savedAccounts.value.filter((account) => (account as any).remember),
  );

  // ===== 操作方法 =====

  /**
   * 设置当前账户
   */
  function setCurrentAccount(account: AccountDTO | null) {
    currentAccount.value = account;

    // 持久化到 localStorage
    if (account) {
      localStorage.setItem('currentAccount', JSON.stringify(account));
    } else {
      localStorage.removeItem('currentAccount');
    }
  }

  /**
   * 清除当前账户
   */
  function clearCurrentAccount() {
    currentAccount.value = null;
    subscription.value = null;
    accountHistory.value = [];
    localStorage.removeItem('currentAccount');
  }

  /**
   * 设置订阅信息
   */
  function setSubscription(sub: SubscriptionDTO | null) {
    subscription.value = sub;
  }

  /**
   * 设置账户历史
   */
  function setAccountHistory(history: AccountHistoryDTO[]) {
    accountHistory.value = history;
  }

  /**
   * 添加历史记录
   */
  function addHistoryRecord(record: AccountHistoryDTO) {
    accountHistory.value.unshift(record);
  }

  /**
   * 设置账户统计
   */
  function setAccountStats(stats: AccountStatsDTO) {
    accountStats.value = stats;
  }

  /**
   * 设置加载状态
   */
  function setLoading(loading: boolean) {
    isLoading.value = loading;
  }

  /**
   * 设置错误
   */
  function setError(err: string | null) {
    error.value = err;
  }

  /**
   * 保存账户列表
   */
  function setSavedAccounts(accounts: AccountDTO[]) {
    savedAccounts.value = accounts;
    localStorage.setItem('savedAccounts', JSON.stringify(accounts));
  }

  /**
   * 添加保存的账户
   */
  function addSavedAccount(account: AccountDTO) {
    const exists = savedAccounts.value.find((acc) => acc.uuid === account.uuid);
    if (!exists) {
      savedAccounts.value.push(account);
      localStorage.setItem('savedAccounts', JSON.stringify(savedAccounts.value));
    }
  }

  /**
   * 移除保存的账户
   */
  function removeSavedAccount(accountUuid: string) {
    savedAccounts.value = savedAccounts.value.filter((acc) => acc.uuid !== accountUuid);
    localStorage.setItem('savedAccounts', JSON.stringify(savedAccounts.value));
  }

  /**
   * 从 localStorage 恢复账户信息
   */
  function restoreFromStorage() {
    try {
      const savedAccount = localStorage.getItem('currentAccount');
      if (savedAccount) {
        currentAccount.value = JSON.parse(savedAccount);
      }

      const savedAccountsList = localStorage.getItem('savedAccounts');
      if (savedAccountsList) {
        savedAccounts.value = JSON.parse(savedAccountsList);
      }
    } catch (error) {
      console.error('Failed to restore account from storage:', error);
      setError('Failed to restore account data');
    }
  }

  /**
   * 清除所有数据
   */
  function clearAll() {
    currentAccount.value = null;
    subscription.value = null;
    accountHistory.value = [];
    accountStats.value = null;
    savedAccounts.value = [];
    isLoading.value = false;
    error.value = null;

    localStorage.removeItem('currentAccount');
    localStorage.removeItem('savedAccounts');
  }

  // ===== 初始化 =====
  // 自动从 localStorage 恢复
  restoreFromStorage();

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

    // 操作方法
    setCurrentAccount,
    clearCurrentAccount,
    setSubscription,
    setAccountHistory,
    addHistoryRecord,
    setAccountStats,
    setLoading,
    setError,
    setSavedAccounts,
    addSavedAccount,
    removeSavedAccount,
    restoreFromStorage,
    clearAll,
  };
});
