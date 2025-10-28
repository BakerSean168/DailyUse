import { apiClient } from '@/shared/api/instances';
import type { AccountContracts } from '@dailyuse/contracts';

/**
 * Account API 客户端
 * 负责账户相关的 API 调用
 *
 * API 路由设计:
 * - POST   /accounts                    - 创建账户
 * - GET    /accounts/:id                - 获取账户详情
 * - GET    /accounts                    - 获取账户列表
 * - PUT    /accounts/:id/profile        - 更新账户资料
 * - PUT    /accounts/:id/preferences    - 更新账户偏好
 * - PUT    /accounts/:id/email          - 更新邮箱
 * - POST   /accounts/:id/verify-email   - 验证邮箱
 * - PUT    /accounts/:id/phone          - 更新手机号
 * - POST   /accounts/:id/verify-phone   - 验证手机号
 * - POST   /accounts/:id/deactivate     - 停用账户
 * - POST   /accounts/:id/suspend        - 暂停账户
 * - POST   /accounts/:id/activate       - 激活账户
 * - DELETE /accounts/:id                - 删除账户（软删除）
 * - GET    /accounts/stats              - 获取账户统计
 * - GET    /accounts/:id/subscription   - 获取订阅信息
 * - POST   /accounts/:id/subscribe      - 订阅计划
 * - DELETE /accounts/:id/subscription   - 取消订阅
 * - GET    /accounts/:id/history        - 获取账户历史
 */
export class AccountApiClient {
  private readonly baseUrl = '/accounts';

  // ============ 账户 CRUD ============

  /**
   * 创建账户
   */
  async createAccount(
    request: AccountContracts.CreateAccountRequestDTO,
  ): Promise<AccountContracts.AccountDTO> {
    const data = await apiClient.post(this.baseUrl, request);
    return data;
  }

  /**
   * 获取账户详情
   */
  async getAccountById(accountId: string): Promise<AccountContracts.AccountDTO> {
    const data = await apiClient.get(`${this.baseUrl}/${accountId}`);
    return data;
  }

  /**
   * 获取账户列表
   */
  async getAccounts(
    params?: AccountContracts.AccountQueryParams,
  ): Promise<AccountContracts.AccountListResponseDTO> {
    const data = await apiClient.get(this.baseUrl, { params });
    return data;
  }

  /**
   * 删除账户（软删除）
   */
  async deleteAccount(accountId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${accountId}`);
  }

  // ============ 账户资料管理 ============

  /**
   * 更新账户资料
   */
  async updateProfile(
    accountId: string,
    request: AccountContracts.UpdateAccountProfileRequestDTO,
  ): Promise<AccountContracts.AccountDTO> {
    const data = await apiClient.put(`${this.baseUrl}/${accountId}/profile`, request);
    return data;
  }

  /**
   * 更新账户偏好
   */
  async updatePreferences(
    accountId: string,
    request: AccountContracts.UpdateAccountPreferencesRequestDTO,
  ): Promise<AccountContracts.AccountDTO> {
    const data = await apiClient.put(`${this.baseUrl}/${accountId}/preferences`, request);
    return data;
  }

  // ============ 邮箱和手机号管理 ============

  /**
   * 更新邮箱
   */
  async updateEmail(
    accountId: string,
    request: AccountContracts.UpdateEmailRequestDTO,
  ): Promise<AccountContracts.AccountDTO> {
    const data = await apiClient.put(`${this.baseUrl}/${accountId}/email`, request);
    return data;
  }

  /**
   * 验证邮箱
   */
  async verifyEmail(
    accountId: string,
    request: AccountContracts.VerifyEmailRequestDTO,
  ): Promise<AccountContracts.AccountDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${accountId}/verify-email`, request);
    return data;
  }

  /**
   * 更新手机号
   */
  async updatePhone(
    accountId: string,
    request: AccountContracts.UpdatePhoneRequestDTO,
  ): Promise<AccountContracts.AccountDTO> {
    const data = await apiClient.put(`${this.baseUrl}/${accountId}/phone`, request);
    return data;
  }

  /**
   * 验证手机号
   */
  async verifyPhone(
    accountId: string,
    request: AccountContracts.VerifyPhoneRequestDTO,
  ): Promise<AccountContracts.AccountDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${accountId}/verify-phone`, request);
    return data;
  }

  // ============ 账户状态管理 ============

  /**
   * 停用账户
   */
  async deactivateAccount(accountId: string): Promise<AccountContracts.AccountDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${accountId}/deactivate`);
    return data;
  }

  /**
   * 暂停账户
   */
  async suspendAccount(accountId: string): Promise<AccountContracts.AccountDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${accountId}/suspend`);
    return data;
  }

  /**
   * 激活账户
   */
  async activateAccount(accountId: string): Promise<AccountContracts.AccountDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${accountId}/activate`);
    return data;
  }

  // ============ 订阅管理 ============

  /**
   * 获取订阅信息
   */
  async getSubscription(accountId: string): Promise<AccountContracts.SubscriptionDTO> {
    const data = await apiClient.get(`${this.baseUrl}/${accountId}/subscription`);
    return data;
  }

  /**
   * 订阅计划
   */
  async subscribePlan(
    accountId: string,
    request: AccountContracts.SubscribePlanRequestDTO,
  ): Promise<AccountContracts.SubscriptionDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${accountId}/subscribe`, request);
    return data;
  }

  /**
   * 取消订阅
   */
  async cancelSubscription(
    accountId: string,
    request?: AccountContracts.CancelSubscriptionRequestDTO,
  ): Promise<AccountContracts.SubscriptionDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${accountId}/subscription/cancel`, request);
    return data;
  }

  // ============ 账户历史 ============

  /**
   * 获取账户历史
   */
  async getAccountHistory(
    accountId: string,
    params?: { page?: number; limit?: number },
  ): Promise<AccountContracts.AccountHistoryListResponseDTO> {
    const data = await apiClient.get(`${this.baseUrl}/${accountId}/history`, { params });
    return data;
  }

  // ============ 账户统计 ============

  /**
   * 获取账户统计
   */
  async getAccountStats(): Promise<AccountContracts.AccountStatsResponseDTO> {
    const data = await apiClient.get(`${this.baseUrl}/stats`);
    return data;
  }
}

// 导出单例
export const accountApiClient = new AccountApiClient();
