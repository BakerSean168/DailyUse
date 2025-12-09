/**
 * Account Desktop Application Service
 *
 * 包装 @dailyuse/application-server/account 和 authentication 的所有 Use Cases
 * 为 Desktop IPC handlers 提供统一的应用服务入口
 * 
 * NOTE: Desktop 版本主要使用离线模式，大部分在线功能返回占位符
 */

import {
  getAccountProfile,
  updateAccountProfile,
  type GetAccountProfileInput,
  type GetAccountProfileOutput,
  type UpdateAccountProfileInput,
  type UpdateAccountProfileOutput,
} from '@dailyuse/application-server';

import type { AccountClientDTO } from '@dailyuse/contracts/account';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AccountDesktopAppService');

// Local desktop user - a simplified version for offline mode
interface LocalDesktopUser {
  uuid: string;
  email: string;
  name: string;
  createdAt: string;
}

const LOCAL_DESKTOP_USER: LocalDesktopUser = {
  uuid: 'local-user',
  email: 'local@desktop.app',
  name: 'Desktop User',
  createdAt: new Date().toISOString(),
};

export class AccountDesktopApplicationService {
  constructor() {
    // Container should be initialized by infrastructure module
  }

  // ===== Core Account =====

  /**
   * 创建账户（仅在线模式）
   */
  async createAccount(request: { email: string; password: string; username?: string }): Promise<{ uuid: string }> {
    logger.debug('Creating account', { email: request.email });
    // Desktop offline mode - return placeholder
    return { uuid: 'todo' };
  }

  /**
   * 获取账户
   */
  async getAccount(uuid: string): Promise<LocalDesktopUser | null> {
    logger.debug('Getting account', { uuid });
    // Desktop offline mode - return local user if requesting local account
    if (uuid === 'local-user') {
      return LOCAL_DESKTOP_USER;
    }
    return null;
  }

  /**
   * 更新账户
   */
  async updateAccount(
    uuid: string,
    request: { name?: string; email?: string },
  ): Promise<LocalDesktopUser | null> {
    logger.debug('Updating account', { uuid });
    // Desktop offline mode - return updated local user
    if (uuid === 'local-user') {
      return {
        ...LOCAL_DESKTOP_USER,
        ...request,
      };
    }
    return null;
  }

  /**
   * 删除账户
   */
  async deleteAccount(uuid: string): Promise<{ success: boolean; error?: string }> {
    logger.debug('Deleting account', { uuid });
    return { success: false, error: 'Cannot delete local account' };
  }

  // ===== Me (Current User) =====

  /**
   * 获取当前用户
   */
  async getCurrentUser(): Promise<LocalDesktopUser> {
    logger.debug('Getting current user');
    return LOCAL_DESKTOP_USER;
  }

  /**
   * 更新当前用户
   */
  async updateCurrentUser(request: { name?: string; email?: string }): Promise<{ success: boolean }> {
    logger.debug('Updating current user');
    return { success: true };
  }

  /**
   * 更改密码
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    logger.debug('Changing password');
    return { success: false, error: 'Desktop offline mode' };
  }

  /**
   * 更改邮箱
   */
  async changeEmail(newEmail: string): Promise<{ success: boolean; error?: string }> {
    logger.debug('Changing email');
    return { success: false, error: 'Desktop offline mode' };
  }

  /**
   * 验证邮箱
   */
  async verifyEmail(token: string): Promise<{ success: boolean; error?: string }> {
    logger.debug('Verifying email');
    return { success: false, error: 'Desktop offline mode' };
  }

  /**
   * 删除当前用户
   */
  async deleteCurrentUser(): Promise<{ success: boolean; error?: string }> {
    logger.debug('Deleting current user');
    return { success: false, error: 'Cannot delete local account' };
  }

  // ===== Profile =====

  /**
   * 获取用户资料
   */
  async getProfile(uuid: string): Promise<GetAccountProfileOutput | null> {
    logger.debug('Getting profile', { uuid });
    try {
      return await getAccountProfile({ accountUuid: uuid });
    } catch {
      return null;
    }
  }

  /**
   * 更新用户资料
   */
  async updateProfile(
    uuid: string,
    request: Partial<Omit<UpdateAccountProfileInput, 'accountUuid'>>,
  ): Promise<UpdateAccountProfileOutput | null> {
    logger.debug('Updating profile', { uuid });
    try {
      return await updateAccountProfile({ accountUuid: uuid, ...request });
    } catch {
      return null;
    }
  }

  /**
   * 上传头像
   */
  async uploadAvatar(uuid: string, imageData: string): Promise<{ success: boolean; avatarUrl: string | null }> {
    logger.debug('Uploading avatar', { uuid });
    // TODO: Implement local avatar storage
    return { success: true, avatarUrl: null };
  }

  /**
   * 移除头像
   */
  async removeAvatar(uuid: string): Promise<{ success: boolean }> {
    logger.debug('Removing avatar', { uuid });
    return { success: true };
  }

  // ===== Subscription =====

  /**
   * 获取订阅信息
   */
  async getSubscription(): Promise<{
    plan: string;
    status: string;
    features: string[];
  }> {
    logger.debug('Getting subscription');
    return {
      plan: 'desktop-free',
      status: 'active',
      features: ['offline-mode', 'local-storage'],
    };
  }

  /**
   * 升级订阅
   */
  async upgradeSubscription(planId: string): Promise<{ success: boolean; error?: string }> {
    logger.debug('Upgrading subscription', { planId });
    return { success: false, error: 'Desktop offline mode' };
  }

  /**
   * 取消订阅
   */
  async cancelSubscription(): Promise<{ success: boolean; error?: string }> {
    logger.debug('Cancelling subscription');
    return { success: false, error: 'Desktop offline mode' };
  }

  /**
   * 获取发票
   */
  async getInvoices(): Promise<{ invoices: any[]; total: number }> {
    logger.debug('Getting invoices');
    return { invoices: [], total: 0 };
  }

  /**
   * 获取使用量
   */
  async getUsage(): Promise<{
    storage: { used: number; limit: number };
    api: { used: number; limit: number };
  }> {
    logger.debug('Getting usage');
    return {
      storage: { used: 0, limit: -1 },
      api: { used: 0, limit: -1 },
    };
  }
}
