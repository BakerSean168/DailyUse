/**
 * Account Application Service - Renderer
 *
 * 账户应用服务 - 渲染进程
 *
 * 职责：
 * - 作为展示层与 Use Cases 之间的桥梁
 * - 调用 @dailyuse/application-client 的 Use Cases
 * - 不包含业务逻辑
 */

import {
  // Use Cases
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
  updateAccountPreferences,
  getAccountById,
  getSubscription,
  getAccountStats,
  // Types
  type UpdateMyProfileInput,
  type ChangeMyPasswordInput,
} from '@dailyuse/application-client';
import type {
  AccountDTO,
  SubscriptionDTO,
  UpdateAccountPreferencesRequestDTO,
  AccountStatsResponseDTO,
} from '@dailyuse/contracts/account';

/**
 * Account Application Service
 *
 * 渲染进程账户应用服务
 */
export class AccountApplicationService {
  private static instance: AccountApplicationService;

  private constructor() {}

  static getInstance(): AccountApplicationService {
    if (!AccountApplicationService.instance) {
      AccountApplicationService.instance = new AccountApplicationService();
    }
    return AccountApplicationService.instance;
  }

  // ===== Profile =====

  /**
   * 获取当前用户资料
   */
  async getMyProfile(): Promise<AccountDTO> {
    return getMyProfile();
  }

  /**
   * 更新当前用户资料
   */
  async updateMyProfile(input: UpdateMyProfileInput): Promise<AccountDTO> {
    return updateMyProfile(input);
  }

  /**
   * 修改密码
   */
  async changeMyPassword(input: ChangeMyPasswordInput): Promise<{ success: boolean; message: string }> {
    return changeMyPassword(input);
  }

  /**
   * 获取指定账户
   */
  async getAccountById(accountId: string): Promise<AccountDTO | null> {
    try {
      return await getAccountById(accountId);
    } catch {
      return null;
    }
  }

  // ===== Preferences =====

  /**
   * 更新账户偏好设置
   */
  async updatePreferences(
    accountId: string,
    request: UpdateAccountPreferencesRequestDTO,
  ): Promise<AccountDTO> {
    return updateAccountPreferences({ accountId, request });
  }

  // ===== Subscription =====

  /**
   * 获取订阅信息
   */
  async getSubscription(accountId: string): Promise<SubscriptionDTO | null> {
    try {
      const result = await getSubscription(accountId);
      return result;
    } catch {
      return null;
    }
  }

  // ===== Stats =====

  /**
   * 获取账户统计
   */
  async getAccountStats(): Promise<AccountStatsResponseDTO | null> {
    try {
      return await getAccountStats();
    } catch {
      return null;
    }
  }
}

// 导出单例实例
export const accountApplicationService = AccountApplicationService.getInstance();
