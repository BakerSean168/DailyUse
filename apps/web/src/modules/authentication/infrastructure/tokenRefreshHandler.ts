/**
 * Token 刷新处理器
 * @description 监听 token 刷新请求事件，执行 token 刷新逻辑
 */

import { AuthManager } from '@/shared/api/core/interceptors';
import { apiClient } from '@/shared/api';
import router from '@/shared/router';

/**
 * Token 刷新处理器类
 */
class TokenRefreshHandler {
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;

  /**
   * 初始化事件监听器
   */
  initialize(): void {
    console.log('[TokenRefreshHandler] 🚀 初始化 Token 刷新处理器');

    // 监听 token 刷新请求事件
    window.addEventListener('auth:token-refresh-requested', ((event: CustomEvent) => {
      const { reason, url } = event.detail || {};
      console.log('[TokenRefreshHandler] 🔔 收到 Token 刷新请求', { reason, url });

      this.handleTokenRefresh()
        .then(() => {
          console.log('[TokenRefreshHandler] ✅ Token 刷新成功');
        })
        .catch((error) => {
          console.error('[TokenRefreshHandler] ❌ Token 刷新失败', error);
        });
    }) as EventListener);

    console.log('[TokenRefreshHandler] ✅ 事件监听器已注册');
  }

  /**
   * 处理 token 刷新
   */
  private async handleTokenRefresh(): Promise<string> {
    // 如果已经在刷新中，返回现有的 Promise
    if (this.isRefreshing && this.refreshPromise) {
      console.log('[TokenRefreshHandler] ⏳ Token 正在刷新中，等待完成...');
      return this.refreshPromise;
    }

    this.isRefreshing = true;

    // 创建刷新 Promise
    this.refreshPromise = this.performTokenRefresh()
      .finally(() => {
        this.isRefreshing = false;
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  /**
   * 执行 token 刷新
   */
  private async performTokenRefresh(): Promise<string> {
    try {
      console.log('[TokenRefreshHandler] 🔄 开始刷新 Token...');

      // 调用 API 刷新 token
      // 🔥 Refresh Token 存储在 httpOnly Cookie 中，浏览器会自动发送
      const response = await apiClient.post<any>(
        '/auth/sessions/refresh',
        {}, // Body 为空，Refresh Token 从 Cookie 读取
        {
          headers: {
            'X-Skip-Auth': 'true', // 标记为刷新请求，避免重复拦截
          },
        } as any, // withCredentials 在 client 配置中已设置
      );

      const { accessToken, expiresIn } = response.data;

      // 更新 Access Token
      AuthManager.updateAccessToken(accessToken, expiresIn);

      console.log('[TokenRefreshHandler] ✅ Token 刷新成功，有效期:', expiresIn, '秒');

      // 🔔 触发 token 刷新成功事件
      window.dispatchEvent(
        new CustomEvent('auth:token-refreshed', {
          detail: { accessToken, expiresIn },
        }),
      );

      return accessToken;
    } catch (error: any) {
      console.error('[TokenRefreshHandler] ❌ Token 刷新失败', error);

      // 🔥 解析错误信息，显示友好提示
      const errorCode = error?.response?.data?.errors?.[0]?.code;
      const userMessage = error?.response?.data?.errors?.[0]?.message;

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

      console.warn('[TokenRefreshHandler] ⚠️', friendlyMessage);

      // 清除令牌
      AuthManager.clearTokens();

      // 🔔 触发 token 刷新失败事件
      window.dispatchEvent(
        new CustomEvent('auth:token-refresh-failed', {
          detail: {
            error,
            errorCode,
            message: friendlyMessage,
          },
        }),
      );

      // 🔔 触发 Session 过期事件（用于显示友好提示）
      window.dispatchEvent(
        new CustomEvent('auth:session-expired', {
          detail: {
            message: friendlyMessage,
            reason: reason,
            errorCode: errorCode,
          },
        }),
      );

      // 跳转到登录页
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

      throw error;
    }
  }
}

// 创建单例
const tokenRefreshHandler = new TokenRefreshHandler();

// 导出初始化方法
export function initializeTokenRefreshHandler(): void {
  tokenRefreshHandler.initialize();
}

// 导出实例（用于测试）
export { tokenRefreshHandler };
