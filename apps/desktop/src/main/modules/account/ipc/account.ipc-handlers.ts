/**
 * Account Module IPC Handlers (Refactored)
 *
 * 使用 createModuleIpcHandlers 简化的 Account IPC 处理器
 * 每个 handler 都是对 AccountDesktopApplicationService 的一行委托
 *
 * 架构优势：
 * - 统一的错误处理和日志记录
 * - 极简的 handler 定义
 * - 清晰的 channel 列表
 */

import { createLogger } from '@dailyuse/utils';
import { createModuleIpcHandlers } from '../../../utils';
import {
  AccountDesktopApplicationService,
  createAccountDesktopApplicationService,
  type CreateAccountInput,
} from '../application/AccountDesktopApplicationService';

const logger = createLogger('AccountIpcHandlers');

// 惰性初始化的服务实例
let service: AccountDesktopApplicationService | null = null;

function getService(): AccountDesktopApplicationService {
  if (!service) {
    service = createAccountDesktopApplicationService(logger);
  }
  return service;
}

// 创建模块 IPC handler 注册器
const { handle, register, getChannels } = createModuleIpcHandlers('Account', logger);

// ============================================
// Core Account Handlers
// ============================================

/**
 * @description 创建新账户
 * Channel Name: account:create
 * Payload: CreateAccountInput { username, email, password }
 * Return: { success: boolean; uuid?: string; error?: string }
 * Security: None
 */
handle<CreateAccountInput, { success: boolean; uuid?: string; error?: string }>(
  'account:create',
  (input) => getService().createAccount(input),
);

/**
 * @description 获取账户信息
 * Channel Name: account:get
 * Payload: string (uuid)
 * Return: Account data or null
 * Security: Requires authentication
 */
handle<string, unknown>(
  'account:get',
  (uuid) => getService().getAccount(uuid),
  { errorResult: null },
);

/**
 * @description 更新账户信息
 * Channel Name: account:update
 * Payload: { uuid: string; data: { nickname?: string; avatarUrl?: string; bio?: string } }
 * Return: Updated account data
 * Security: Requires authentication
 */
handle<{ uuid: string; data: { nickname?: string; avatarUrl?: string; bio?: string } }, unknown>(
  'account:update',
  ({ uuid, data }) => getService().updateAccount(uuid, data),
);

/**
 * @description 删除账户
 * Channel Name: account:delete
 * Payload: string (uuid)
 * Return: { success: boolean; error?: string }
 * Security: Requires admin privileges
 */
handle<string, { success: boolean; error?: string }>(
  'account:delete',
  (uuid) => getService().deleteAccount(uuid),
);

// ============================================
// Me (Current User) Handlers
// ============================================

/**
 * @description 获取当前登录用户信息
 * Channel Name: account:me:get
 * Payload: void
 * Return: Current User Data
 * Security: Requires authentication
 */
handle<void, unknown>(
  'account:me:get',
  () => getService().getCurrentUser(),
);

/**
 * @description 更新当前用户信息
 * Channel Name: account:me:update
 * Payload: { name?: string; email?: string }
 * Return: { success: boolean }
 * Security: Requires authentication
 */
handle<{ name?: string; email?: string }, { success: boolean }>(
  'account:me:update',
  (request) => getService().updateCurrentUser(request),
);

/**
 * @description 修改密码
 * Channel Name: account:me:change-password
 * Payload: { oldPassword: string; newPassword: string }
 * Return: { success: boolean; error?: string }
 * Security: Requires authentication
 */
handle<{ oldPassword: string; newPassword: string }, { success: boolean; error?: string }>(
  'account:me:change-password',
  ({ oldPassword, newPassword }) => getService().changePassword(oldPassword, newPassword),
);

/**
 * @description 修改邮箱
 * Channel Name: account:me:change-email
 * Payload: string (newEmail)
 * Return: { success: boolean; error?: string }
 * Security: Requires authentication
 */
handle<string, { success: boolean; error?: string }>(
  'account:me:change-email',
  (newEmail) => getService().changeEmail(newEmail),
);

/**
 * @description 验证邮箱
 * Channel Name: account:me:verify-email
 * Payload: string (token)
 * Return: { success: boolean; error?: string }
 * Security: None
 */
handle<string, { success: boolean; error?: string }>(
  'account:me:verify-email',
  (token) => getService().verifyEmail(token),
);

/**
 * @description 删除当前用户账户
 * Channel Name: account:me:delete
 * Payload: void
 * Return: { success: boolean; error?: string }
 * Security: Requires authentication
 */
handle<void, { success: boolean; error?: string }>(
  'account:me:delete',
  () => getService().deleteCurrentUser(),
);

// ============================================
// Profile Handlers
// ============================================

/**
 * @description 获取用户资料
 * Channel Name: account:profile:get
 * Payload: string (uuid)
 * Return: Profile data
 * Security: Requires authentication
 */
handle<string, unknown>(
  'account:profile:get',
  (uuid) => getService().getProfile(uuid),
  { errorResult: null },
);

/**
 * @description 更新用户资料
 * Channel Name: account:profile:update
 * Payload: { uuid: string; data: Record<string, unknown> }
 * Return: Updated profile data
 * Security: Requires authentication
 */
handle<{ uuid: string; data: Record<string, unknown> }, unknown>(
  'account:profile:update',
  ({ uuid, data }) => getService().updateProfile(uuid, data),
);

/**
 * @description 上传用户头像
 * Channel Name: account:profile:upload-avatar
 * Payload: { uuid: string; imageData: string }
 * Return: { success: boolean; avatarUrl: string | null }
 * Security: Requires authentication
 */
handle<{ uuid: string; imageData: string }, { success: boolean; avatarUrl: string | null }>(
  'account:profile:upload-avatar',
  ({ uuid, imageData }) => getService().uploadAvatar(uuid, imageData),
);

/**
 * @description 移除用户头像
 * Channel Name: account:profile:remove-avatar
 * Payload: string (uuid)
 * Return: { success: boolean }
 * Security: Requires authentication
 */
handle<string, { success: boolean }>(
  'account:profile:remove-avatar',
  (uuid) => getService().removeAvatar(uuid),
);

// ============================================
// Subscription Handlers
// ============================================

/**
 * @description 获取订阅信息
 * Channel Name: account:subscription:get
 * Payload: void
 * Return: { plan: string; status: string; features: string[] }
 * Security: Requires authentication
 */
handle<void, { plan: string; status: string; features: string[] }>(
  'account:subscription:get',
  () => getService().getSubscription(),
);

/**
 * @description 升级订阅
 * Channel Name: account:subscription:upgrade
 * Payload: string (planId)
 * Return: { success: boolean; error?: string }
 * Security: Requires authentication
 */
handle<string, { success: boolean; error?: string }>(
  'account:subscription:upgrade',
  (planId) => getService().upgradeSubscription(planId),
);

/**
 * @description 取消订阅
 * Channel Name: account:subscription:cancel
 * Payload: void
 * Return: { success: boolean; error?: string }
 * Security: Requires authentication
 */
handle<void, { success: boolean; error?: string }>(
  'account:subscription:cancel',
  () => getService().cancelSubscription(),
);

/**
 * @description 获取发票列表
 * Channel Name: account:subscription:get-invoices
 * Payload: void
 * Return: { invoices: unknown[]; total: number }
 * Security: Requires authentication
 */
handle<void, { invoices: unknown[]; total: number }>(
  'account:subscription:get-invoices',
  () => getService().getInvoices(),
);

/**
 * @description 获取资源使用情况
 * Channel Name: account:subscription:get-usage
 * Payload: void
 * Return: { storage: { used: number; limit: number }; api: { used: number; limit: number } }
 * Security: Requires authentication
 */
handle<void, { storage: { used: number; limit: number }; api: { used: number; limit: number } }>(
  'account:subscription:get-usage',
  () => getService().getUsage(),
);

// ============================================
// Export Functions
// ============================================

/**
 * 注册 Account 模块的 IPC 处理器
 */
export function registerAccountIpcHandlers(): void {
  register();
}

/**
 * 注销 Account 模块的 IPC 处理器
 */
export function unregisterAccountIpcHandlers(): void {
  const { removeIpcHandlers } = require('../../../utils');
  logger.info('Unregistering Account IPC handlers...');
  removeIpcHandlers(getChannels());
  service = null;
  logger.info('Account IPC handlers unregistered');
}

/**
 * 获取所有 Account IPC channels
 */
export function getAccountIpcChannels(): string[] {
  return getChannels();
}
