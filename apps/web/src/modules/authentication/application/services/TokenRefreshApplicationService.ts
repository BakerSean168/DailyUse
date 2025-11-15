import { apiClient } from '@/shared/api';
import { AuthManager } from '@/shared/api/core/interceptors';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('TokenRefreshApplicationService');

/**
 * Token 刷新应用服务
 * 
 * 职责：
 * - 处理 Access Token 刷新的业务逻辑
 * - 调用后端 API 刷新 token
 * - 更新认证管理器中的 token
 * - 防止重复刷新
 */
export class TokenRefreshApplicationService {
  private static instance: TokenRefreshApplicationService;
  private isRefreshing = false;
  private refreshPromise: Promise<{ accessToken: string; expiresIn: number }> | null = null;

  private constructor() {}

  /**
   * 获取服务单例
   */
  static getInstance(): TokenRefreshApplicationService {
    if (!TokenRefreshApplicationService.instance) {
      TokenRefreshApplicationService.instance = new TokenRefreshApplicationService();
    }
    return TokenRefreshApplicationService.instance;
  }

  /**
   * 刷新 Access Token
   * 
   * @returns 新的 Access Token 和过期时间
   * @throws 如果刷新失败（如 Refresh Token 已过期）
   */
  async refreshAccessToken(): Promise<{ accessToken: string; expiresIn: number }> {
    logger.debug('Token refresh requested');

    // 防止重复刷新
    if (this.isRefreshing && this.refreshPromise) {
      logger.debug('Token refresh already in progress, reusing promise');
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performRefresh()
      .finally(() => {
        logger.debug('Token refresh completed, resetting state');
        this.isRefreshing = false;
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  /**
   * 执行实际的 Token 刷新操作
   */
  private async performRefresh(): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      logger.info('Calling refresh token API');

      // 调用后端 API 刷新 token
      // 使用 X-Skip-Auth 跳过拦截器，避免循环刷新
      const response = await apiClient.post<any>(
        '/auth/refresh',  // ✅ 修复：正确的路由是 /auth/refresh 而非 /auth/sessions/refresh
        {},
        {
          headers: { 'X-Skip-Auth': 'true' }
        }
      );

      const { accessToken, expiresIn } = response.data;

      // 更新认证管理器中的 token
      AuthManager.updateAccessToken(accessToken, expiresIn);

      logger.info('Token refreshed successfully', {
        expiresIn,
        newTokenLength: accessToken.length,
      });

      return { accessToken, expiresIn };
    } catch (error) {
      logger.error('Failed to refresh token', error);
      
      // 清除本地认证状态
      AuthManager.clearTokens();

      throw error;
    }
  }

  /**
   * 重置刷新状态（用于测试）
   */
  resetState(): void {
    this.isRefreshing = false;
    this.refreshPromise = null;
  }
}
