/**
 * Auth Container
 *
 * Authentication 模块的依赖容器，管理:
 * - Auth API Client
 * - Token Storage (可选)
 */

import { DIContainer, ModuleContainerBase } from '../shared/di';
import type { IAuthApiClient } from './ports/auth-api-client.port';

/**
 * Auth 模块依赖键
 */
const KEYS = {
  API_CLIENT: Symbol('AuthApiClient'),
  TOKEN_STORAGE: Symbol('AuthTokenStorage'),
} as const;

/**
 * Token 存储接口
 */
export interface IAuthTokenStorage {
  getToken(): string | null;
  setToken(token: string): void;
  removeToken(): void;
}

/**
 * Auth 模块依赖容器
 */
export class AuthContainer extends ModuleContainerBase {
  private static instance: AuthContainer;

  private constructor() {
    super();
  }

  static getInstance(): AuthContainer {
    if (!AuthContainer.instance) {
      AuthContainer.instance = new AuthContainer();
    }
    return AuthContainer.instance;
  }

  static resetInstance(): void {
    AuthContainer.instance = undefined as unknown as AuthContainer;
  }

  // ============ API Client ============

  registerApiClient(client: IAuthApiClient): this {
    this.container.register(KEYS.API_CLIENT, client);
    return this;
  }

  getApiClient(): IAuthApiClient {
    return this.container.resolve<IAuthApiClient>(KEYS.API_CLIENT);
  }

  hasApiClient(): boolean {
    return this.container.has(KEYS.API_CLIENT);
  }

  // ============ Token Storage (可选) ============

  registerTokenStorage(storage: IAuthTokenStorage): this {
    this.container.register(KEYS.TOKEN_STORAGE, storage);
    return this;
  }

  getTokenStorage(): IAuthTokenStorage {
    return this.container.resolve<IAuthTokenStorage>(KEYS.TOKEN_STORAGE);
  }

  tryGetTokenStorage(): IAuthTokenStorage | undefined {
    return this.container.tryResolve<IAuthTokenStorage>(KEYS.TOKEN_STORAGE);
  }

  hasTokenStorage(): boolean {
    return this.container.has(KEYS.TOKEN_STORAGE);
  }

  // ============ 通用方法 ============

  isConfigured(): boolean {
    return this.hasApiClient();
  }

  clear(): void {
    this.container.unregister(KEYS.API_CLIENT);
    this.container.unregister(KEYS.TOKEN_STORAGE);
  }
}

export { KEYS as AuthDependencyKeys };
