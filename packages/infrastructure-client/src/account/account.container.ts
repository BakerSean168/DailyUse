/**
 * Account Container
 *
 * Account 模块的依赖容器，管理:
 * - Account API Client
 * - Repository (本地存储，可选)
 */

import { DIContainer, ModuleContainerBase } from '../shared/di';
import type { IAccountApiClient } from './ports/account-api-client.port';

/**
 * Account 模块依赖键
 */
const KEYS = {
  API_CLIENT: Symbol('AccountApiClient'),
  REPOSITORY: Symbol('AccountRepository'),
} as const;

/**
 * Account 仓储接口（本地存储）
 */
export interface IAccountRepository {
  // 后续根据需要扩展
}

/**
 * Account 模块依赖容器
 */
export class AccountContainer extends ModuleContainerBase {
  private static instance: AccountContainer;

  private constructor() {
    super();
  }

  static getInstance(): AccountContainer {
    if (!AccountContainer.instance) {
      AccountContainer.instance = new AccountContainer();
    }
    return AccountContainer.instance;
  }

  static resetInstance(): void {
    AccountContainer.instance = undefined as unknown as AccountContainer;
  }

  // ============ API Client ============

  registerApiClient(client: IAccountApiClient): this {
    this.container.register(KEYS.API_CLIENT, client);
    return this;
  }

  getApiClient(): IAccountApiClient {
    return this.container.resolve<IAccountApiClient>(KEYS.API_CLIENT);
  }

  hasApiClient(): boolean {
    return this.container.has(KEYS.API_CLIENT);
  }

  // ============ Repository (可选) ============

  registerRepository(repo: IAccountRepository): this {
    this.container.register(KEYS.REPOSITORY, repo);
    return this;
  }

  getRepository(): IAccountRepository {
    return this.container.resolve<IAccountRepository>(KEYS.REPOSITORY);
  }

  tryGetRepository(): IAccountRepository | undefined {
    return this.container.tryResolve<IAccountRepository>(KEYS.REPOSITORY);
  }

  hasRepository(): boolean {
    return this.container.has(KEYS.REPOSITORY);
  }

  // ============ 便利属性（向后兼容） ============

  /**
   * 获取 Account API Client（便利属性）
   * @deprecated 请使用 getApiClient() 方法
   */
  get accountClient(): IAccountApiClient {
    return this.getApiClient();
  }

  // ============ 通用方法 ============

  isConfigured(): boolean {
    return this.hasApiClient();
  }

  clear(): void {
    this.container.unregister(KEYS.API_CLIENT);
    this.container.unregister(KEYS.REPOSITORY);
  }
}

export { KEYS as AccountDependencyKeys };
