/**
 * Authentication Container
 *
 * Authentication 模块的依赖容器
 */

import type { IAuthApiClient } from '../../authentication';
import { DIContainer } from './DIContainer';
import { DependencyKeys } from './dependency-keys';

/**
 * Authentication 依赖容器
 */
export class AuthenticationContainer {
  private static instance: AuthenticationContainer;

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
   * 创建新实例（用于测试）
   */
  static createInstance(): AuthenticationContainer {
    AuthenticationContainer.instance = new AuthenticationContainer();
    return AuthenticationContainer.instance;
  }

  /**
   * 重置容器
   */
  static resetInstance(): void {
    AuthenticationContainer.instance = undefined as unknown as AuthenticationContainer;
  }

  /**
   * 注册 Auth API Client
   */
  registerAuthApiClient(client: IAuthApiClient): void {
    DIContainer.getInstance().register(DependencyKeys.AUTH_API_CLIENT, client);
  }

  /**
   * 获取 Auth API Client
   */
  getAuthApiClient(): IAuthApiClient {
    return DIContainer.getInstance().resolve<IAuthApiClient>(DependencyKeys.AUTH_API_CLIENT);
  }
}
