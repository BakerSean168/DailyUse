/**
 * Account Profile Application Service
 * 账户资料应用服务 - 负责账户资料相关的用例
 */

import type { AccountContracts } from '@dailyuse/contracts';
import { useAccountStore } from '../../presentation/stores/accountStore';
import { accountApiClient } from '../../infrastructure/api/accountApiClient';

export class AccountProfileApplicationService {
  private static instance: AccountProfileApplicationService;

  private constructor() {}

  /**
   * 创建应用服务实例
   */
  static createInstance(): AccountProfileApplicationService {
    AccountProfileApplicationService.instance = new AccountProfileApplicationService();
    return AccountProfileApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static getInstance(): AccountProfileApplicationService {
    if (!AccountProfileApplicationService.instance) {
      AccountProfileApplicationService.instance = AccountProfileApplicationService.createInstance();
    }
    return AccountProfileApplicationService.instance;
  }

  /**
   * 懒加载获取 Account Store
   */
  private get accountStore(): ReturnType<typeof useAccountStore> {
    return useAccountStore();
  }

  // ============ 账户资料管理用例 ============

  /**
   * 获取账户详情
   */
  async getAccountById(accountId: string): Promise<AccountContracts.AccountDTO> {
    try {
      this.accountStore.setLoading(true);
      const account = await accountApiClient.getAccountById(accountId);
      this.accountStore.setCurrentAccount(account);
      return account;
    } catch (error) {
      console.error('Failed to get account:', error);
      throw error;
    } finally {
      this.accountStore.setLoading(false);
    }
  }

  /**
   * 更新账户资料
   */
  async updateProfile(
    accountId: string,
    request: AccountContracts.UpdateAccountProfileRequestDTO,
  ): Promise<AccountContracts.AccountDTO> {
    try {
      this.accountStore.setLoading(true);
      const updatedAccount = await accountApiClient.updateProfile(accountId, request);
      this.accountStore.setCurrentAccount(updatedAccount);
      return updatedAccount;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    } finally {
      this.accountStore.setLoading(false);
    }
  }

  /**
   * 更新账户偏好
   */
  async updatePreferences(
    accountId: string,
    request: AccountContracts.UpdateAccountPreferencesRequestDTO,
  ): Promise<AccountContracts.AccountDTO> {
    try {
      this.accountStore.setLoading(true);
      const updatedAccount = await accountApiClient.updatePreferences(accountId, request);
      this.accountStore.setCurrentAccount(updatedAccount);
      return updatedAccount;
    } catch (error) {
      console.error('Failed to update preferences:', error);
      throw error;
    } finally {
      this.accountStore.setLoading(false);
    }
  }

  // ============ 邮箱和手机号管理用例 ============

  /**
   * 更新邮箱
   */
  async updateEmail(
    accountId: string,
    request: AccountContracts.UpdateEmailRequestDTO,
  ): Promise<AccountContracts.AccountDTO> {
    try {
      this.accountStore.setLoading(true);
      const updatedAccount = await accountApiClient.updateEmail(accountId, request);
      this.accountStore.setCurrentAccount(updatedAccount);
      return updatedAccount;
    } catch (error) {
      console.error('Failed to update email:', error);
      throw error;
    } finally {
      this.accountStore.setLoading(false);
    }
  }

  /**
   * 验证邮箱
   */
  async verifyEmail(
    accountId: string,
    request: AccountContracts.VerifyEmailRequestDTO,
  ): Promise<AccountContracts.AccountDTO> {
    try {
      this.accountStore.setLoading(true);
      const updatedAccount = await accountApiClient.verifyEmail(accountId, request);
      this.accountStore.setCurrentAccount(updatedAccount);
      return updatedAccount;
    } catch (error) {
      console.error('Failed to verify email:', error);
      throw error;
    } finally {
      this.accountStore.setLoading(false);
    }
  }

  /**
   * 更新手机号
   */
  async updatePhone(
    accountId: string,
    request: AccountContracts.UpdatePhoneRequestDTO,
  ): Promise<AccountContracts.AccountDTO> {
    try {
      this.accountStore.setLoading(true);
      const updatedAccount = await accountApiClient.updatePhone(accountId, request);
      this.accountStore.setCurrentAccount(updatedAccount);
      return updatedAccount;
    } catch (error) {
      console.error('Failed to update phone:', error);
      throw error;
    } finally {
      this.accountStore.setLoading(false);
    }
  }

  /**
   * 验证手机号
   */
  async verifyPhone(
    accountId: string,
    request: AccountContracts.VerifyPhoneRequestDTO,
  ): Promise<AccountContracts.AccountDTO> {
    try {
      this.accountStore.setLoading(true);
      const updatedAccount = await accountApiClient.verifyPhone(accountId, request);
      this.accountStore.setCurrentAccount(updatedAccount);
      return updatedAccount;
    } catch (error) {
      console.error('Failed to verify phone:', error);
      throw error;
    } finally {
      this.accountStore.setLoading(false);
    }
  }

  // ============ 账户状态管理用例 ============

  /**
   * 停用账户
   */
  async deactivateAccount(accountId: string): Promise<AccountContracts.AccountDTO> {
    try {
      this.accountStore.setLoading(true);
      const updatedAccount = await accountApiClient.deactivateAccount(accountId);
      this.accountStore.setCurrentAccount(updatedAccount);
      return updatedAccount;
    } catch (error) {
      console.error('Failed to deactivate account:', error);
      throw error;
    } finally {
      this.accountStore.setLoading(false);
    }
  }

  /**
   * 激活账户
   */
  async activateAccount(accountId: string): Promise<AccountContracts.AccountDTO> {
    try {
      this.accountStore.setLoading(true);
      const updatedAccount = await accountApiClient.activateAccount(accountId);
      this.accountStore.setCurrentAccount(updatedAccount);
      return updatedAccount;
    } catch (error) {
      console.error('Failed to activate account:', error);
      throw error;
    } finally {
      this.accountStore.setLoading(false);
    }
  }

  /**
   * 删除账户
   */
  async deleteAccount(accountId: string): Promise<void> {
    try {
      this.accountStore.setLoading(true);
      await accountApiClient.deleteAccount(accountId);
      this.accountStore.clearCurrentAccount();
    } catch (error) {
      console.error('Failed to delete account:', error);
      throw error;
    } finally {
      this.accountStore.setLoading(false);
    }
  }

  // ============ 账户历史查询用例 ============

  /**
   * 获取账户历史
   */
  async getAccountHistory(
    accountId: string,
    params?: { page?: number; limit?: number },
  ): Promise<AccountContracts.AccountHistoryListResponseDTO> {
    try {
      this.accountStore.setLoading(true);
      const history = await accountApiClient.getAccountHistory(accountId, params);
      return history;
    } catch (error) {
      console.error('Failed to get account history:', error);
      throw error;
    } finally {
      this.accountStore.setLoading(false);
    }
  }
}

// 导出单例
export const accountProfileApplicationService = AccountProfileApplicationService.getInstance();
