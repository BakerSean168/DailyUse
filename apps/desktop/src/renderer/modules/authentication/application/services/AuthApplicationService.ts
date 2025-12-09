/**
 * Auth Application Service - Renderer
 *
 * 认证应用服务 - 渲染进程
 *
 * 职责：
 * - 调用 @dailyuse/application-client 的 Auth Use Cases
 * - 管理 Token 存储
 * - 不包含业务逻辑
 */

import {
  // Use Cases
  login,
  logout,
  register,
  forgotPassword,
  resetPassword,
  changePassword,
  refreshToken,
  // Types
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
  type ChangePasswordInput,
} from '@dailyuse/application-client';
import type { LoginResponseDTO, RegisterRequestDTO } from '@dailyuse/contracts/authentication';

// RegisterResponse type
type RegisterResponse = { success: boolean; message?: string };

// ===== Local Storage Keys =====

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'dailyuse_access_token',
  REFRESH_TOKEN: 'dailyuse_refresh_token',
  TOKEN_EXPIRES_AT: 'dailyuse_token_expires_at',
  USER: 'dailyuse_user',
} as const;

/**
 * Auth Application Service
 *
 * 渲染进程认证应用服务
 */
export class AuthApplicationService {
  private static instance: AuthApplicationService;

  private constructor() {}

  static getInstance(): AuthApplicationService {
    if (!AuthApplicationService.instance) {
      AuthApplicationService.instance = new AuthApplicationService();
    }
    return AuthApplicationService.instance;
  }

  // ===== Authentication =====

  /**
   * 登录
   */
  async login(input: LoginInput): Promise<LoginResponseDTO> {
    const response = await login(input);
    this.saveTokens(response);
    return response;
  }

  /**
   * 注册
   */
  async register(input: RegisterInput): Promise<RegisterResponse> {
    return register(input);
  }

  /**
   * 登出
   */
  async logout(): Promise<void> {
    try {
      await logout({});
    } catch (e) {
      console.warn('[AuthService] Logout API call failed:', e);
    } finally {
      this.clearTokens();
    }
  }

  // ===== Password =====

  /**
   * 忘记密码
   */
  async forgotPassword(email: string): Promise<void> {
    await forgotPassword({ email });
  }

  /**
   * 重置密码
   */
  async resetPassword(input: ResetPasswordInput): Promise<void> {
    await resetPassword(input);
  }

  /**
   * 修改密码
   */
  async changePassword(input: ChangePasswordInput): Promise<void> {
    await changePassword(input);
  }

  // ===== Token Management =====

  /**
   * 刷新 Token
   */
  async refreshAccessToken(): Promise<LoginResponseDTO | null> {
    const storedRefreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!storedRefreshToken) {
      return null;
    }

    try {
      const response = await refreshToken({ refreshToken: storedRefreshToken });
      this.saveTokens(response);
      return response;
    } catch {
      this.clearTokens();
      return null;
    }
  }

  /**
   * 检查 Token 是否有效
   */
  isTokenValid(): boolean {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const expiresAt = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
    if (!token || !expiresAt) return false;
    return Date.now() < parseInt(expiresAt, 10);
  }

  /**
   * 获取存储的用户信息
   */
  getStoredUser<T>(): T | null {
    const userJson = localStorage.getItem(STORAGE_KEYS.USER);
    if (!userJson) return null;
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }

  /**
   * 保存用户信息
   */
  saveUser(user: unknown): void {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  // ===== Private Methods =====

  private saveTokens(response: LoginResponseDTO): void {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
    if (response.refreshToken) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
    }
    localStorage.setItem(
      STORAGE_KEYS.TOKEN_EXPIRES_AT,
      String(response.accessTokenExpiresAt || Date.now() + 3600000),
    );
  }

  private clearTokens(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
}

// 导出单例实例
export const authApplicationService = AuthApplicationService.getInstance();
