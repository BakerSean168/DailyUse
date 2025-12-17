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

/**
 * @description 用户登录
 * Channel Name: auth:login
 * Payload: LoginCredentials { email, password }
 * Return: AuthOperationResult { success, user?, token?, error? }
 * Security: None
 */
handle<LoginCredentials, AuthOperationResult>(
  'auth:login',
  (credentials) => getService().login(credentials),
);

/**
 * @description 用户注册
 * Channel Name: auth:register
 * Payload: RegisterRequest { email, password, username }
 * Return: AuthOperationResult { success, user?, token?, error? }
 * Security: None
 */
handle<RegisterRequest, AuthOperationResult>(
  'auth:register',
  (request) => getService().register(request),
);

/**
 * @description 用户登出
 * Channel Name: auth:logout
 * Payload: void
 * Return: AuthOperationResult { success }
 * Security: Requires authentication
 */
handle<void, AuthOperationResult>(
  'auth:logout',
  () => getService().logout(),
);

/**
 * @description 刷新访问令牌
 * Channel Name: auth:refresh-token
 * Payload: void
 * Return: AuthOperationResult { success, token? }
 * Security: Requires valid refresh token
 */
handle<void, AuthOperationResult>(
  'auth:refresh-token',
  () => getService().refreshToken(),
);

/**
 * @description 验证令牌有效性
 * Channel Name: auth:verify-token
 * Payload: string (token)
 * Return: { valid: boolean }
 * Security: None
 */
handle<string, { valid: boolean }>(
  'auth:verify-token',
  (token) => getService().verifyToken(token),
);

/**
 * @description 获取当前认证状态
 * Channel Name: auth:get-status
 * Payload: void
 * Return: AuthStatus { isAuthenticated, user?, is2FAEnabled }
 * Security: None
 */
handle<void, AuthStatus>(
  'auth:get-status',
  () => getService().getStatus(),
);

// ============================================
// 2FA Handlers
// ============================================

/**
 * @description 启用双因素认证
 * Channel Name: auth:2fa:enable
 * Payload: string (method, e.g. 'totp')
 * Return: AuthOperationResult { success, qrCodeUrl?, secret? }
 * Security: Requires authentication
 */
handle<string, AuthOperationResult>(
  'auth:2fa:enable',
  (method) => getService().enable2FA(method || 'totp'),
);

/**
 * @description 禁用双因素认证
 * Channel Name: auth:2fa:disable
 * Payload: void
 * Return: AuthOperationResult { success }
 * Security: Requires authentication
 */
handle<void, AuthOperationResult>(
  'auth:2fa:disable',
  () => getService().disable2FA(),
);

/**
 * @description 验证双因素认证代码
 * Channel Name: auth:2fa:verify
 * Payload: string (code)
 * Return: AuthOperationResult { success }
 * Security: Requires authentication
 */
handle<string, AuthOperationResult>(
  'auth:2fa:verify',
  (code) => getService().verify2FA(code),
);

/**
 * @description 获取双因素认证状态
 * Channel Name: auth:2fa:get-status
 * Payload: void
 * Return: TwoFactorStatus { enabled, method }
 * Security: Requires authentication
 */
handle<void, TwoFactorStatus>(
  'auth:2fa:get-status',
  () => getService().get2FAStatus(),
);

/**
 * @description 生成备用代码
 * Channel Name: auth:2fa:generate-backup-codes
 * Payload: void
 * Return: { codes: string[] }
 * Security: Requires authentication
 */
handle<void, { codes: string[] }>(
  'auth:2fa:generate-backup-codes',
  () => getService().generateBackupCodes(),
);

// ============================================
// API Key Handlers
// ============================================

/**
 * @description 创建 API 密钥
 * Channel Name: auth:api-key:create
 * Payload: { name: string; scopes?: string[] }
 * Return: { uuid: string; key: string } | null
 * Security: Requires authentication
 */
handle<{ name: string; scopes?: string[] }, { uuid: string; key: string } | null>(
  'auth:api-key:create',
  (request) => getService().createApiKey(request),
);

/**
 * @description 列出所有 API 密钥
 * Channel Name: auth:api-key:list
 * Payload: void
 * Return: { apiKeys: ApiKeyInfo[]; total: number }
 * Security: Requires authentication
 */
handle<void, { apiKeys: ApiKeyInfo[]; total: number }>(
  'auth:api-key:list',
  () => getService().listApiKeys(),
);

/**
 * @description 撤销 API 密钥
 * Channel Name: auth:api-key:revoke
 * Payload: string (keyId)
 * Return: AuthOperationResult { success }
 * Security: Requires authentication
 */
handle<string, AuthOperationResult>(
  'auth:api-key:revoke',
  (keyId) => getService().revokeApiKey(keyId),
);

/**
 * @description 轮换 API 密钥
 * Channel Name: auth:api-key:rotate
 * Payload: string (keyId)
 * Return: { newKey: string | null }
 * Security: Requires authentication
 */
handle<string, { newKey: string | null }>(
  'auth:api-key:rotate',
  (keyId) => getService().rotateApiKey(keyId),
);

// ============================================
// Session Handlers
// ============================================

/**
 * @description 列出所有活动会话
 * Channel Name: auth:session:list
 * Payload: void
 * Return: { sessions: SessionInfo[]; total: number }
 * Security: Requires authentication
 */
handle<void, { sessions: SessionInfo[]; total: number }>(
  'auth:session:list',
  () => getService().listSessions(),
);

/**
 * @description 获取当前会话信息
 * Channel Name: auth:session:get-current
 * Payload: void
 * Return: SessionInfo | null
 * Security: Requires authentication
 */
handle<void, SessionInfo | null>(
  'auth:session:get-current',
  () => getService().getCurrentSession(),
);

/**
 * @description 撤销指定会话
 * Channel Name: auth:session:revoke
 * Payload: string (sessionId)
 * Return: AuthOperationResult { success }
 * Security: Requires authentication
 */
handle<string, AuthOperationResult>(
  'auth:session:revoke',
  (sessionId) => getService().revokeSession(sessionId),
);

/**
 * @description 撤销所有会话
 * Channel Name: auth:session:revoke-all
 * Payload: void
 * Return: { success: boolean; count: number }
 * Security: Requires authentication
 */
handle<void, { success: boolean; count: number }>(
  'auth:session:revoke-all',
  () => getService().revokeAllSessions(),
);

// ============================================
// Device Handlers
// ============================================

/**
 * @description 列出所有已登录设备
 * Channel Name: auth:device:list
 * Payload: void
 * Return: { devices: DeviceInfo[]; total: number }
 * Security: Requires authentication
 */
handle<void, { devices: DeviceInfo[]; total: number }>(
  'auth:device:list',
  () => getService().listDevices(),
);

/**
 * @description 获取当前设备信息
 * Channel Name: auth:device:get-current
 * Payload: void
 * Return: DeviceInfo
 * Security: Requires authentication
 */
handle<void, DeviceInfo>(
  'auth:device:get-current',
  () => getService().getCurrentDevice(),
);

/**
 * @description 移除设备（登出该设备）
 * Channel Name: auth:device:revoke
 * Payload: string (deviceId)
 * Return: AuthOperationResult { success }
 * Security: Requires authentication
 */
handle<string, AuthOperationResult>(
  'auth:device:revoke',
  (deviceId) => getService().revokeDevice(deviceId),
);

/**
 * @description 重命名设备
 * Channel Name: auth:device:rename
 * Payload: { deviceId: string; name: string }
 * Return: AuthOperationResult { success }
 * Security: Requires authentication
 */
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
