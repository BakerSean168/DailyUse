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

handle<CreateAccountInput, { success: boolean; uuid?: string; error?: string }>(
  'account:create',
  (input) => getService().createAccount(input),
);

handle<string, unknown>(
  'account:get',
  (uuid) => getService().getAccount(uuid),
  { errorResult: null },
);

handle<{ uuid: string; data: { nickname?: string; avatarUrl?: string; bio?: string } }, unknown>(
  'account:update',
  ({ uuid, data }) => getService().updateAccount(uuid, data),
);

handle<string, { success: boolean; error?: string }>(
  'account:delete',
  (uuid) => getService().deleteAccount(uuid),
);

// ============================================
// Me (Current User) Handlers
// ============================================

handle<void, unknown>(
  'account:me:get',
  () => getService().getCurrentUser(),
);

handle<{ name?: string; email?: string }, { success: boolean }>(
  'account:me:update',
  (request) => getService().updateCurrentUser(request),
);

handle<{ oldPassword: string; newPassword: string }, { success: boolean; error?: string }>(
  'account:me:change-password',
  ({ oldPassword, newPassword }) => getService().changePassword(oldPassword, newPassword),
);

handle<string, { success: boolean; error?: string }>(
  'account:me:change-email',
  (newEmail) => getService().changeEmail(newEmail),
);

handle<string, { success: boolean; error?: string }>(
  'account:me:verify-email',
  (token) => getService().verifyEmail(token),
);

handle<void, { success: boolean; error?: string }>(
  'account:me:delete',
  () => getService().deleteCurrentUser(),
);

// ============================================
// Profile Handlers
// ============================================

handle<string, unknown>(
  'account:profile:get',
  (uuid) => getService().getProfile(uuid),
  { errorResult: null },
);

handle<{ uuid: string; data: Record<string, unknown> }, unknown>(
  'account:profile:update',
  ({ uuid, data }) => getService().updateProfile(uuid, data),
);

handle<{ uuid: string; imageData: string }, { success: boolean; avatarUrl: string | null }>(
  'account:profile:upload-avatar',
  ({ uuid, imageData }) => getService().uploadAvatar(uuid, imageData),
);

handle<string, { success: boolean }>(
  'account:profile:remove-avatar',
  (uuid) => getService().removeAvatar(uuid),
);

// ============================================
// Subscription Handlers
// ============================================

handle<void, { plan: string; status: string; features: string[] }>(
  'account:subscription:get',
  () => getService().getSubscription(),
);

handle<string, { success: boolean; error?: string }>(
  'account:subscription:upgrade',
  (planId) => getService().upgradeSubscription(planId),
);

handle<void, { success: boolean; error?: string }>(
  'account:subscription:cancel',
  () => getService().cancelSubscription(),
);

handle<void, { invoices: unknown[]; total: number }>(
  'account:subscription:get-invoices',
  () => getService().getInvoices(),
);

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
