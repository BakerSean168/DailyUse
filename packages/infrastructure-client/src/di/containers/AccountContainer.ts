/**
 * Account Container
 *
 * Account 模块的依赖容器
 */

import type { IAccountApiClient } from '../../account';
import { DIContainer } from './DIContainer';
import { DependencyKeys } from './dependency-keys';

/**
 * Account 依赖容器
 */
export class AccountContainer {
  private static instance: AccountContainer;

  private constructor() {}

  /**
   * 获取容器单例
   */
  static getInstance(): AccountContainer {
    if (!AccountContainer.instance) {
      AccountContainer.instance = new AccountContainer();
    }
    return AccountContainer.instance;
  }

  /**
   * 重置容器
   */
  static resetInstance(): void {
    AccountContainer.instance = undefined as unknown as AccountContainer;
  }

  /**
   * 注册 Account API Client
   */
  registerAccountApiClient(client: IAccountApiClient): void {
    DIContainer.getInstance().register(DependencyKeys.ACCOUNT_API_CLIENT, client);
  }

  /**
   * 获取 Account API Client
   */
  getAccountApiClient(): IAccountApiClient {
    return DIContainer.getInstance().resolve<IAccountApiClient>(DependencyKeys.ACCOUNT_API_CLIENT);
  }
}
