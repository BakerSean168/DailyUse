/**
 * Account Profile Application Service
 *
 * 账户资料应用服务 - 负责账户资料相关的用例
 *
 * 设计说明：
 * - ApplicationService 只负责 API 调用和数据返回
 * - Store 操作由上层（Composable/Presenter）负责
 */

import type {
  AccountDTO,
  AccountHistoryListResponseDTO,
  UpdateAccountProfileRequestDTO,
  UpdateAccountPreferencesRequestDTO,
  UpdateEmailRequestDTO,
  VerifyEmailRequestDTO,
  UpdatePhoneRequestDTO,
  VerifyPhoneRequestDTO,
} from '@dailyuse/contracts/account';
import type { IAccountApiClient } from '@dailyuse/infrastructure-client';

/**
 * Account Profile Application Service
 */
export class AccountProfileApplicationService {
  constructor(private readonly apiClient: IAccountApiClient) {}

  // ===== 当前用户资料管理用例 (/me) =====

  /**
   * 获取当前用户资料
   */
  async getMyProfile(): Promise<AccountDTO> {
    return this.apiClient.getMyProfile();
  }

  /**
   * 更新当前用户资料
   */
  async updateMyProfile(request: UpdateAccountProfileRequestDTO): Promise<AccountDTO> {
    return this.apiClient.updateMyProfile(request);
  }

  /**
   * 修改当前用户密码
   */
  async changeMyPassword(request: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    return this.apiClient.changeMyPassword(request);
  }

  // ===== 账户资料管理用例 =====

  /**
   * 获取账户详情
   */
  async getAccountById(accountId: string): Promise<AccountDTO> {
    return this.apiClient.getAccountById(accountId);
  }

  /**
   * 更新账户资料
   */
  async updateProfile(
    accountId: string,
    request: UpdateAccountProfileRequestDTO,
  ): Promise<AccountDTO> {
    return this.apiClient.updateProfile(accountId, request);
  }

  /**
   * 更新账户偏好
   */
  async updatePreferences(
    accountId: string,
    request: UpdateAccountPreferencesRequestDTO,
  ): Promise<AccountDTO> {
    return this.apiClient.updatePreferences(accountId, request);
  }

  // ===== 邮箱和手机号管理用例 =====

  /**
   * 更新邮箱
   */
  async updateEmail(accountId: string, request: UpdateEmailRequestDTO): Promise<AccountDTO> {
    return this.apiClient.updateEmail(accountId, request);
  }

  /**
   * 验证邮箱
   */
  async verifyEmail(accountId: string, request: VerifyEmailRequestDTO): Promise<AccountDTO> {
    return this.apiClient.verifyEmail(accountId, request);
  }

  /**
   * 更新手机号
   */
  async updatePhone(accountId: string, request: UpdatePhoneRequestDTO): Promise<AccountDTO> {
    return this.apiClient.updatePhone(accountId, request);
  }

  /**
   * 验证手机号
   */
  async verifyPhone(accountId: string, request: VerifyPhoneRequestDTO): Promise<AccountDTO> {
    return this.apiClient.verifyPhone(accountId, request);
  }

  // ===== 账户状态管理用例 =====

  /**
   * 停用账户
   */
  async deactivateAccount(accountId: string): Promise<AccountDTO> {
    return this.apiClient.deactivateAccount(accountId);
  }

  /**
   * 激活账户
   */
  async activateAccount(accountId: string): Promise<AccountDTO> {
    return this.apiClient.activateAccount(accountId);
  }

  /**
   * 删除账户
   */
  async deleteAccount(accountId: string): Promise<void> {
    return this.apiClient.deleteAccount(accountId);
  }

  // ===== 账户历史查询用例 =====

  /**
   * 获取账户历史
   */
  async getAccountHistory(
    accountId: string,
    params?: { page?: number; limit?: number },
  ): Promise<AccountHistoryListResponseDTO> {
    return this.apiClient.getAccountHistory(accountId, params);
  }
}

/**
 * Factory function to create AccountProfileApplicationService
 */
export function createAccountProfileApplicationService(
  apiClient: IAccountApiClient,
): AccountProfileApplicationService {
  return new AccountProfileApplicationService(apiClient);
}
