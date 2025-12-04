/**
 * Account Container
 *
 * Account 模块的依赖注入容器
 */

import type { IAccountApiClient } from '@dailyuse/infrastructure-client';

/**
 * Account Container
 * 管理 Account 模块的依赖注入
 */
export class AccountContainer {
  private static instance: AccountContainer;
  private accountApiClient: IAccountApiClient | null = null;

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
   * 重置容器（用于测试）
   */
  static resetInstance(): void {
    AccountContainer.instance = undefined as unknown as AccountContainer;
  }

  /**
   * 注册 Account API Client
   */
  registerAccountApiClient(client: IAccountApiClient): void {
    this.accountApiClient = client;
  }

  /**
   * 获取 Account API Client
   */
  getAccountApiClient(): IAccountApiClient {
    if (!this.accountApiClient) {
      throw new Error(
        'AccountApiClient not registered. Call registerAccountApiClient() first.',
      );
    }
    return this.accountApiClient;
  }
}
