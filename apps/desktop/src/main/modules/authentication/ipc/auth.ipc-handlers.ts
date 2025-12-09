/**
 * Auth Module IPC Handlers
 *
 * 使用 createModuleIpcHandlers 简化的 Auth IPC 处理器
 * 每个 handler 都是对 AuthDesktopApplicationService 的一行委托
 *
 * 架构优势：
 * - 统一的错误处理和日志记录
 * - 极简的 handler 定义
 * - 清晰的 channel 列表
 */

import { createLogger } from '@dailyuse/utils';
import { createModuleIpcHandlers } from '../../../utils';
import {
  AuthDesktopApplicationService,
  createAuthDesktopApplicationService,
  type LoginCredentials,
  type RegisterRequest,
  type AuthOperationResult,
  type AuthStatus,
  type TwoFactorStatus,
  type ApiKeyInfo,
  type SessionInfo,
  type DeviceInfo,
} from '../application/AuthDesktopApplicationService';

const logger = createLogger('AuthIpcHandlers');

// 惰性初始化的服务实例
let service: AuthDesktopApplicationService | null = null;

function getService(): AuthDesktopApplicationService {
  if (!service) {
    service = createAuthDesktopApplicationService(logger);
  }
  return service;
}

// 创建模块 IPC handler 注册器
const { handle, register, getChannels } = createModuleIpcHandlers('Auth', logger);

// ============================================
// Core Auth Handlers
// ============================================

handle<LoginCredentials, AuthOperationResult>(
  'auth:login',
  (credentials) => getService().login(credentials),
);

handle<RegisterRequest, AuthOperationResult>(
  'auth:register',
  (request) => getService().register(request),
);

handle<void, AuthOperationResult>(
  'auth:logout',
  () => getService().logout(),
);

handle<void, AuthOperationResult>(
  'auth:refresh-token',
  () => getService().refreshToken(),
);

handle<string, { valid: boolean }>(
  'auth:verify-token',
  (token) => getService().verifyToken(token),
);

handle<void, AuthStatus>(
  'auth:get-status',
  () => getService().getStatus(),
);

// ============================================
// 2FA Handlers
// ============================================

handle<string, AuthOperationResult>(
  'auth:2fa:enable',
  (method) => getService().enable2FA(method || 'totp'),
);

handle<void, AuthOperationResult>(
  'auth:2fa:disable',
  () => getService().disable2FA(),
);

handle<string, AuthOperationResult>(
  'auth:2fa:verify',
  (code) => getService().verify2FA(code),
);

handle<void, TwoFactorStatus>(
  'auth:2fa:get-status',
  () => getService().get2FAStatus(),
);

handle<void, { codes: string[] }>(
  'auth:2fa:generate-backup-codes',
  () => getService().generateBackupCodes(),
);

// ============================================
// API Key Handlers
// ============================================

handle<{ name: string; scopes?: string[] }, { uuid: string; key: string } | null>(
  'auth:api-key:create',
  (request) => getService().createApiKey(request),
);

handle<void, { apiKeys: ApiKeyInfo[]; total: number }>(
  'auth:api-key:list',
  () => getService().listApiKeys(),
);

handle<string, AuthOperationResult>(
  'auth:api-key:revoke',
  (keyId) => getService().revokeApiKey(keyId),
);

handle<string, { newKey: string | null }>(
  'auth:api-key:rotate',
  (keyId) => getService().rotateApiKey(keyId),
);

// ============================================
// Session Handlers
// ============================================

handle<void, { sessions: SessionInfo[]; total: number }>(
  'auth:session:list',
  () => getService().listSessions(),
);

handle<void, SessionInfo | null>(
  'auth:session:get-current',
  () => getService().getCurrentSession(),
);

handle<string, AuthOperationResult>(
  'auth:session:revoke',
  (sessionId) => getService().revokeSession(sessionId),
);

handle<void, { success: boolean; count: number }>(
  'auth:session:revoke-all',
  () => getService().revokeAllSessions(),
);

// ============================================
// Device Handlers
// ============================================

handle<void, { devices: DeviceInfo[]; total: number }>(
  'auth:device:list',
  () => getService().listDevices(),
);

handle<void, DeviceInfo>(
  'auth:device:get-current',
  () => getService().getCurrentDevice(),
);

handle<string, AuthOperationResult>(
  'auth:device:revoke',
  (deviceId) => getService().revokeDevice(deviceId),
);

handle<{ deviceId: string; name: string }, AuthOperationResult>(
  'auth:device:rename',
  ({ deviceId, name }) => getService().renameDevice(deviceId, name),
);

// ============================================
// Export Functions
// ============================================

/**
 * 注册 Auth 模块的 IPC 处理器
 */
export function registerAuthIpcHandlers(): void {
  register();
}

/**
 * 注销 Auth 模块的 IPC 处理器
 */
export function unregisterAuthIpcHandlers(): void {
  const { removeIpcHandlers } = require('../../../utils');
  logger.info('Unregistering Auth IPC handlers...');
  removeIpcHandlers(getChannels());
  service = null;
  logger.info('Auth IPC handlers unregistered');
}

/**
 * 获取所有 Auth IPC channels
 */
export function getAuthIpcChannels(): string[] {
  return getChannels();
}
