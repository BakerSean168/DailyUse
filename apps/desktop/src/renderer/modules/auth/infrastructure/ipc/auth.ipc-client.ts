/**
 * Auth IPC Client - Auth 模块 IPC 客户端
 * 
 * @module renderer/modules/auth/infrastructure/ipc
 */

import { BaseIPCClient, ipcClient } from '@/renderer/shared/infrastructure/ipc';
import { AuthChannels } from '@/shared/types/ipc-channels';

// ============ Types ============

export interface SessionDTO {
  uuid: string;
  accountUuid: string;
  deviceId: string;
  deviceName: string;
  ipAddress?: string;
  userAgent?: string;
  isCurrentDevice: boolean;
  createdAt: number;
  expiresAt: number;
  lastActiveAt: number;
}

export interface AuthStateDTO {
  isAuthenticated: boolean;
  accountUuid?: string;
  sessionUuid?: string;
  expiresAt?: number;
}

export interface TokensDTO {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginResultDTO {
  success: boolean;
  account?: {
    uuid: string;
    email: string;
    name: string;
  };
  tokens?: TokensDTO;
  error?: string;
  requiresTwoFactor?: boolean;
  twoFactorToken?: string;
}

export interface RegisterResultDTO {
  success: boolean;
  account?: {
    uuid: string;
    email: string;
    name: string;
  };
  requiresVerification?: boolean;
  error?: string;
}

export interface TwoFactorConfigDTO {
  enabled: boolean;
  method: 'totp' | 'sms' | 'email';
  backupCodesRemaining?: number;
}

// ============ Auth IPC Client ============

/**
 * Auth IPC Client
 */
export class AuthIPCClient {
  private client: BaseIPCClient;

  constructor(client: BaseIPCClient = ipcClient) {
    this.client = client;
  }

  // ============ Authentication ============

  /**
   * 登录
   */
  async login(params: LoginRequest): Promise<LoginResultDTO> {
    return this.client.invoke<LoginResultDTO>(
      AuthChannels.LOGIN,
      params
    );
  }

  /**
   * 注册
   */
  async register(params: RegisterRequest): Promise<RegisterResultDTO> {
    return this.client.invoke<RegisterResultDTO>(
      AuthChannels.REGISTER,
      params
    );
  }

  /**
   * 登出
   */
  async logout(): Promise<void> {
    return this.client.invoke<void>(
      AuthChannels.LOGOUT,
      {}
    );
  }

  /**
   * 刷新令牌
   */
  async refreshToken(): Promise<TokensDTO> {
    return this.client.invoke<TokensDTO>(
      AuthChannels.REFRESH_TOKEN,
      {}
    );
  }

  /**
   * 获取认证状态
   */
  async getAuthState(): Promise<AuthStateDTO> {
    return this.client.invoke<AuthStateDTO>(
      AuthChannels.CHECK_AUTH,
      {}
    );
  }

  /**
   * 获取当前用户
   */
  async getCurrentUser(): Promise<{ uuid: string; email: string; name: string } | null> {
    return this.client.invoke(
      AuthChannels.GET_CURRENT_USER,
      {}
    );
  }

  // ============ Password ============

  /**
   * 修改密码
   */
  async changePassword(params: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    return this.client.invoke<void>(
      AuthChannels.CHANGE_PASSWORD,
      params
    );
  }

  /**
   * 请求密码重置
   */
  async forgotPassword(email: string): Promise<void> {
    return this.client.invoke<void>(
      AuthChannels.FORGOT_PASSWORD,
      { email }
    );
  }

  /**
   * 重置密码
   */
  async resetPassword(params: {
    token: string;
    newPassword: string;
  }): Promise<void> {
    return this.client.invoke<void>(
      AuthChannels.RESET_PASSWORD,
      params
    );
  }

  // ============ OAuth ============

  /**
   * 开始 OAuth 登录流程
   */
  async startOAuth(provider: 'google' | 'github' | 'microsoft'): Promise<string> {
    return this.client.invoke<string>(
      AuthChannels.OAUTH_START,
      { provider }
    );
  }

  /**
   * 处理 OAuth 回调
   */
  async handleOAuthCallback(params: {
    provider: string;
    code: string;
    state: string;
  }): Promise<LoginResultDTO> {
    return this.client.invoke<LoginResultDTO>(
      AuthChannels.OAUTH_CALLBACK,
      params
    );
  }

  /**
   * 获取可用的 OAuth 提供商
   */
  async getOAuthProviders(): Promise<Array<{ id: string; name: string; enabled: boolean }>> {
    return this.client.invoke(
      AuthChannels.OAUTH_PROVIDERS,
      {}
    );
  }

  /**
   * 社交登录
   */
  async socialLogin(provider: string, token: string): Promise<LoginResultDTO> {
    return this.client.invoke<LoginResultDTO>(
      AuthChannels.SOCIAL_LOGIN,
      { provider, token }
    );
  }

  /**
   * 关联社交账号
   */
  async linkSocial(provider: string, token: string): Promise<void> {
    return this.client.invoke<void>(
      AuthChannels.LINK_SOCIAL,
      { provider, token }
    );
  }

  /**
   * 解除社交账号关联
   */
  async unlinkSocial(provider: string): Promise<void> {
    return this.client.invoke<void>(
      AuthChannels.UNLINK_SOCIAL,
      { provider }
    );
  }

  // ============ Two-Factor Authentication ============

  /**
   * 获取双因素认证状态
   */
  async getTwoFactorStatus(): Promise<TwoFactorConfigDTO> {
    return this.client.invoke<TwoFactorConfigDTO>(
      AuthChannels.TWO_FACTOR_STATUS,
      {}
    );
  }

  /**
   * 启用双因素认证
   */
  async enableTwoFactor(method: 'totp' | 'sms' | 'email'): Promise<{
    secret?: string;
    qrCode?: string;
    backupCodes?: string[];
  }> {
    return this.client.invoke<{
      secret?: string;
      qrCode?: string;
      backupCodes?: string[];
    }>(
      AuthChannels.TWO_FACTOR_ENABLE,
      { method }
    );
  }

  /**
   * 禁用双因素认证
   */
  async disableTwoFactor(password: string): Promise<void> {
    return this.client.invoke<void>(
      AuthChannels.TWO_FACTOR_DISABLE,
      { password }
    );
  }

  /**
   * 验证双因素认证
   */
  async verifyTwoFactor(params: {
    code: string;
    twoFactorToken: string;
  }): Promise<LoginResultDTO> {
    return this.client.invoke<LoginResultDTO>(
      AuthChannels.TWO_FACTOR_VERIFY,
      params
    );
  }

  /**
   * 获取备用码
   */
  async getBackupCodes(password: string): Promise<string[]> {
    return this.client.invoke<string[]>(
      AuthChannels.TWO_FACTOR_BACKUP_CODES,
      { password }
    );
  }

  // ============ Sessions ============

  /**
   * 获取会话列表
   */
  async listSessions(): Promise<SessionDTO[]> {
    return this.client.invoke<SessionDTO[]>(
      AuthChannels.SESSION_LIST,
      {}
    );
  }

  /**
   * 撤销会话
   */
  async revokeSession(sessionUuid: string): Promise<void> {
    return this.client.invoke<void>(
      AuthChannels.SESSION_REVOKE,
      { sessionUuid }
    );
  }

  /**
   * 撤销所有会话
   */
  async revokeAllSessions(): Promise<void> {
    return this.client.invoke<void>(
      AuthChannels.SESSION_REVOKE_ALL,
      {}
    );
  }
}

// ============ Singleton Export ============

export const authIPCClient = new AuthIPCClient();
