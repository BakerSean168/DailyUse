/**
 * Login Application Service
 * 登录应用服务 - 负责登录相关的用例
 */

import type { AuthenticationContracts } from '@dailyuse/contracts';
import { useAuthStore } from '../../presentation/stores/authStore';
import { authApiClient } from '../../infrastructure/api/authApiClient';

export class LoginApplicationService {
  private static instance: LoginApplicationService;

  private constructor() {}

  /**
   * 创建应用服务实例
   */
  static createInstance(): LoginApplicationService {
    LoginApplicationService.instance = new LoginApplicationService();
    return LoginApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static getInstance(): LoginApplicationService {
    if (!LoginApplicationService.instance) {
      LoginApplicationService.instance = LoginApplicationService.createInstance();
    }
    return LoginApplicationService.instance;
  }

  /**
   * 懒加载获取 Auth Store
   */
  private get authStore(): ReturnType<typeof useAuthStore> {
    return useAuthStore();
  }

  // ============ 登录用例 ============

  /**
   * 用户登录
   */
  async login(request: AuthenticationContracts.LoginRequestDTO): Promise<AuthenticationContracts.LoginResponseDTO> {
    try {
      this.authStore.setLoading(true);
      this.authStore.clearError();

      const response = await authApiClient.login(request);

      // 保存tokens和会话信息
      this.authStore.setAccessToken(response.accessToken);
      this.authStore.setRefreshToken(response.refreshToken);
      this.authStore.setCurrentSessionId(response.sessionId);
      this.authStore.setTokenExpiresAt(response.accessTokenExpiresAt);

      return response;
    } catch (error) {
      console.error('Login failed:', error);
      this.authStore.setError('Login failed');
      throw error;
    } finally {
      this.authStore.setLoading(false);
    }
  }

  /**
   * 用户登出
   */
  async logout(request?: AuthenticationContracts.LogoutRequestDTO): Promise<void> {
    try {
      this.authStore.setLoading(true);

      await authApiClient.logout(request);

      // 清除所有认证状态
      this.authStore.clearAuth();
    } catch (error) {
      console.error('Logout failed:', error);
      // 即使登出失败也清除本地状态
      this.authStore.clearAuth();
      throw error;
    } finally {
      this.authStore.setLoading(false);
    }
  }

  /**
   * 刷新访问令牌
   */
  async refreshAccessToken(): Promise<void> {
    try {
      const refreshToken = this.authStore.refreshToken;
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authApiClient.refreshToken({ refreshToken });

      // 更新tokens
      this.authStore.setAccessToken(response.accessToken);
      this.authStore.setRefreshToken(response.refreshToken);
      this.authStore.setTokenExpiresAt(response.accessTokenExpiresAt);
    } catch (error) {
      console.error('Failed to refresh token:', error);
      // Token刷新失败，清除认证状态
      this.authStore.clearAuth();
      throw error;
    }
  }

  /**
   * 检查token是否即将过期（10分钟内过期则刷新）
   */
  async checkAndRefreshToken(): Promise<void> {
    const expiresAt = this.authStore.tokenExpiresAt;
    if (!expiresAt) return;

    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000;

    // 如果token将在10分钟内过期，则刷新
    if (expiresAt - now < tenMinutes) {
      await this.refreshAccessToken();
    }
  }
}

// 导出单例
export const loginApplicationService = LoginApplicationService.getInstance();
