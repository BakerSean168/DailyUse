/**
 * Authentication Module API Request/Response DTOs
 * 认证模块 API 请求响应数据传输对象
 */

import { DeviceType, SessionStatus, CredentialType, TwoFactorMethod } from './enums';

// ============ 认证请求 ============

/**
 * 登录请求
 */
export interface LoginRequest {
  /** 用户名或邮箱 */
  identifier: string;
  /** 密码 */
  password: string;
  /** 记住登录 */
  rememberMe?: boolean;
  /** 设备信息 */
  deviceInfo?: {
    deviceId?: string;
    deviceName?: string;
    deviceType?: DeviceType;
    os?: string;
    browser?: string;
    ipAddress?: string;
  };
}

/**
 * 登录响应
 */
export interface LoginResponseDTO {
  /** 访问令牌 */
  accessToken: string;
  /** 刷新令牌（已废弃 - 现在存储在 httpOnly Cookie 中，不再返回给前端） */
  refreshToken?: string;
  /** 访问令牌过期时间戳 (ms) */
  accessTokenExpiresAt: number;
  /** 刷新令牌过期时间戳 (ms)（已废弃 - Refresh Token 现在存储在 Cookie 中） */
  refreshTokenExpiresAt?: number;
  /** 会话 ID */
  sessionId?: string;
  /** 是否需要两步验证 */
  requiresTwoFactor?: boolean;
}

/**
 * 注册请求
 */
export interface RegisterRequest {
  /** 用户名 */
  username: string;
  /** 邮箱 */
  email: string;
  /** 密码 */
  password: string;
  /** 确认密码 */
  confirmPassword: string;
  /** 设备信息 */
  deviceInfo?: {
    deviceId?: string;
    deviceName?: string;
    deviceType?: DeviceType;
    os?: string;
    browser?: string;
    ipAddress?: string;
  };
}

/**
 * 刷新令牌请求
 */
export interface RefreshTokenRequest {
  /** 刷新令牌 */
  refreshToken: string;
}

/**
 * 刷新令牌响应
 */
export interface RefreshTokenResponseDTO {
  /** 新访问令牌 */
  accessToken: string;
  /** 新刷新令牌（已废弃 - 现在通过 httpOnly Cookie 自动更新） */
  refreshToken?: string;
  /** 访问令牌过期时间戳 (ms) */
  accessTokenExpiresAt: number;
  /** 刷新令牌过期时间戳 (ms)（已废弃 - Refresh Token 现在存储在 Cookie 中） */
  refreshTokenExpiresAt?: number;
}

/**
 * 登出请求
 */
export interface LogoutRequest {
  /** 会话 ID (可选，如果不提供则登出当前会话) */
  sessionId?: string;
  /** 是否登出所有会话 */
  allSessions?: boolean;
}

/**
 * 修改密码请求
 */
export interface ChangePasswordRequest {
  /** 旧密码 */
  oldPassword: string;
  /** 新密码 */
  newPassword: string;
  /** 确认新密码 */
  confirmPassword: string;
}

/**
 * 重置密码请求
 */
export interface ResetPasswordRequest {
  /** 重置令牌 */
  token: string;
  /** 新密码 */
  newPassword: string;
  /** 确认新密码 */
  confirmPassword: string;
}

/**
 * 忘记密码请求
 */
export interface ForgotPasswordRequest {
  /** 邮箱 */
  email: string;
}

// ============ 两步验证请求 ============

/**
 * 启用两步验证请求
 */
export interface Enable2FARequest {
  /** 两步验证方法 */
  method: TwoFactorMethod;
  /** 密码确认 */
  password: string;
}

/**
 * 启用两步验证响应
 */
export interface Enable2FAResponseDTO {
  /** 密钥 (用于 TOTP) */
  secret?: string;
  /** 二维码 URL (用于 TOTP) */
  qrCodeUrl?: string;
  /** 备份码列表 */
  backupCodes?: string[];
}

/**
 * 验证两步验证码请求
 */
export interface Verify2FARequest {
  /** 验证码 */
  code: string;
  /** 会话 ID */
  sessionId?: string;
}

/**
 * 禁用两步验证请求
 */
export interface Disable2FARequest {
  /** 密码确认 */
  password: string;
  /** 验证码 */
  code: string;
}

// ============ API Key 请求 ============

/**
 * 创建 API Key 请求
 */
export interface CreateApiKeyRequest {
  /** API Key 名称 */
  name: string;
  /** 描述 */
  description?: string;
  /** 过期时间戳 (ms, 可选) */
  expiresAt?: number;
  /** 作用域 */
  scopes?: string[];
}

/**
 * 创建 API Key 响应
 */
export interface CreateApiKeyResponseDTO {
  /** API Key ID */
  id: string;
  /** API Key (明文, 只返回一次) */
  key: string;
  /** API Key 名称 */
  name: string;
  /** 创建时间戳 (ms) */
  createdAt: number;
  /** 过期时间戳 (ms) */
  expiresAt?: number;
}

/**
 * 撤销 API Key 请求
 */
export interface RevokeApiKeyRequest {
  /** API Key ID */
  apiKeyId: string;
}

/**
 * API Key 列表响应
 */
export interface ApiKeyListResponseDTO {
  keys: Array<{
    id: string;
    name: string;
    description?: string;
    keyPrefix: string; // 只返回前缀如 "sk_..."
    createdAt: number;
    expiresAt?: number;
    lastUsedAt?: number;
  }>;
}

// ============ 会话管理请求 ============

/**
 * 获取活跃会话请求
 */
export interface GetActiveSessionsRequest {
  /** 页码 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
}

/**
 * 活跃会话响应
 */
export interface ActiveSessionsResponseDTO {
  sessions: Array<{
    id: string;
    deviceName?: string;
    deviceType?: DeviceType;
    os?: string;
    browser?: string;
    ipAddress?: string;
    location?: string;
    createdAt: number;
    lastActivityAt: number;
    isCurrent: boolean;
  }>;
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 撤销会话请求
 */
export interface RevokeSessionRequest {
  /** 会话 ID */
  sessionId: string;
}

/**
 * 撤销所有会话请求（除当前会话外）
 */
export interface RevokeAllSessionsRequest {
  /** 是否包含当前会话 */
  includeCurrent?: boolean;
}

// ============ 设备管理请求 ============

/**
 * 信任设备请求
 */
export interface TrustDeviceRequest {
  /** 设备 ID */
  deviceId: string;
  /** 设备名称 */
  deviceName?: string;
}

/**
 * 撤销设备信任请求
 */
export interface RevokeTrustedDeviceRequest {
  /** 设备 ID */
  deviceId: string;
}

/**
 * 受信任设备列表响应
 */
export interface TrustedDevicesResponseDTO {
  devices: Array<{
    deviceId: string;
    deviceName?: string;
    deviceType?: DeviceType;
    os?: string;
    browser?: string;
    trustedAt: number;
    lastUsedAt?: number;
  }>;
}

// ============ 查询参数 ============

/**
 * 会话查询参数
 */
export interface SessionQueryParams {
  /** 账户 ID */
  accountId?: string;
  /** 会话状态 */
  status?: SessionStatus;
  /** 设备类型 */
  deviceType?: DeviceType;
  /** 开始时间戳 (ms) */
  startDate?: number;
  /** 结束时间戳 (ms) */
  endDate?: number;
  /** 页码 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
}

/**
 * 凭证查询参数
 */
export interface CredentialQueryParams {
  /** 账户 ID */
  accountId?: string;
  /** 凭证类型 */
  type?: CredentialType;
  /** 是否启用 */
  enabled?: boolean;
  /** 页码 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
}
