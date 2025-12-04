/**
 * Authentication Container
 *
 * Authentication 模块的依赖注入容器
 */

import type { IAuthApiClient } from '@dailyuse/infrastructure-client';

/**
 * Authentication Container
 * 管理 Authentication 模块的依赖注入
 */
export class AuthenticationContainer {
  private static instance: AuthenticationContainer;
  private authApiClient: IAuthApiClient | null = null;

  private constructor() {}

  /**
   * 获取容器单例
   */
  static getInstance(): AuthenticationContainer {
    if (!AuthenticationContainer.instance) {
      AuthenticationContainer.instance = new AuthenticationContainer();
    }
    return AuthenticationContainer.instance;
  }

  /**
   * 创建容器实例（用于依赖注入）
   */
  static createInstance(): AuthenticationContainer {
    AuthenticationContainer.instance = new AuthenticationContainer();
    return AuthenticationContainer.instance;
  }

  /**
   * 重置容器（用于测试）
   */
  static resetInstance(): void {
    AuthenticationContainer.instance = undefined as unknown as AuthenticationContainer;
  }

  /**
   * 注册 Auth API Client
   */
  registerAuthApiClient(client: IAuthApiClient): void {
    this.authApiClient = client;
  }

  /**
   * 获取 Auth API Client
   */
  getAuthApiClient(): IAuthApiClient {
    if (!this.authApiClient) {
      throw new Error(
        'AuthApiClient not registered. Call registerAuthApiClient() first.',
      );
    }
    return this.authApiClient;
  }
}
