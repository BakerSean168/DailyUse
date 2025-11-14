import { createLogger } from '@dailyuse/utils';
import { TokenRefreshApplicationService } from '../services/TokenRefreshApplicationService';
import router from '@/shared/router';

const logger = createLogger('TokenRefreshRequestedHandler');

/**
 * Token 刷新请求事件处理器
 * 
 * 职责：
 * - 监听 auth:token-refresh-requested 事件
 * - 调用应用服务刷新 token
 * - 发布刷新成功/失败事件
 * - 处理刷新失败的跳转逻辑
 */
export class TokenRefreshRequestedHandler {
  private static instance: TokenRefreshRequestedHandler;
  private tokenRefreshService: TokenRefreshApplicationService;

  private constructor(tokenRefreshService: TokenRefreshApplicationService) {
    this.tokenRefreshService = tokenRefreshService;
  }

  /**
   * 获取处理器单例
   */
  static getInstance(): TokenRefreshRequestedHandler {
    if (!TokenRefreshRequestedHandler.instance) {
      const service = TokenRefreshApplicationService.getInstance();
      TokenRefreshRequestedHandler.instance = new TokenRefreshRequestedHandler(service);
    }
    return TokenRefreshRequestedHandler.instance;
  }

  /**
   * 处理 token 刷新请求事件
   */
  async handle(event: CustomEvent): Promise<void> {
    const { reason, url } = event.detail || {};
    logger.debug('Token refresh requested', { reason, url });

    try {
      // 调用应用服务刷新 token
      const { accessToken, expiresIn } = await this.tokenRefreshService.refreshAccessToken();

      // 发布刷新成功事件
      window.dispatchEvent(
        new CustomEvent('auth:token-refreshed', {
          detail: { accessToken, expiresIn },
        })
      );

      logger.info('Token refresh succeeded', {
        expiresIn,
        triggeredBy: reason,
      });
    } catch (error: any) {
      logger.error('Token refresh failed', error);

      // 解析错误信息
      const errorCode = error?.response?.data?.errors?.[0]?.code;
      const userMessage = error?.response?.data?.errors?.[0]?.message;

      const { friendlyMessage, reason: failureReason } = this.parseRefreshError(
        errorCode,
        userMessage
      );

      logger.warn('Token refresh failed with user message', {
        errorCode,
        friendlyMessage,
        reason: failureReason,
      });

      // 发布刷新失败事件
      window.dispatchEvent(
        new CustomEvent('auth:token-refresh-failed', {
          detail: {
            error,
            errorCode,
            message: friendlyMessage,
          },
        })
      );

      // 发布 Session 过期事件（用于显示友好提示）
      window.dispatchEvent(
        new CustomEvent('auth:session-expired', {
          detail: {
            message: friendlyMessage,
            reason: failureReason,
            errorCode: errorCode,
          },
        })
      );

      // 跳转到登录页
      this.redirectToLogin(failureReason);
    }
  }

  /**
   * 解析刷新错误，返回友好的错误信息
   */
  private parseRefreshError(
    errorCode: string | undefined,
    userMessage: string | undefined
  ): { friendlyMessage: string; reason: string } {
    let friendlyMessage = '认证失败，请重新登录';
    let reason = 'session-expired';

    if (errorCode === 'REFRESH_TOKEN_EXPIRED') {
      friendlyMessage = userMessage || '登录已过期（30天），请重新登录';
      reason = 'refresh-token-expired';
    } else if (errorCode === 'SESSION_REVOKED') {
      friendlyMessage = userMessage || '会话已被撤销，请重新登录';
      reason = 'session-revoked';
    } else if (errorCode === 'SESSION_INVALID') {
      friendlyMessage = userMessage || '会话无效，请重新登录';
      reason = 'session-invalid';
    } else if (errorCode === 'MISSING_REFRESH_TOKEN') {
      friendlyMessage = userMessage || 'Refresh token 缺失，请重新登录';
      reason = 'missing-refresh-token';
    }

    return { friendlyMessage, reason };
  }

  /**
   * 跳转到登录页
   */
  private redirectToLogin(reason: string): void {
    router
      .push({
        name: 'auth',
        query: {
          redirect: router.currentRoute.value.fullPath,
          reason: reason,
        },
      })
      .catch(() => {
        // 如果 router 跳转失败，使用硬跳转
        window.location.href = '/auth/login';
      });
  }
}
