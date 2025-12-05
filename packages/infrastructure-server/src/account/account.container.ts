/**
 * Account Container (Server)
 *
 * 依赖注入容器，管理 Account 模块的 repository 实例
 */

import type { IAccountRepository } from '@dailyuse/domain-server/account';

/**
 * Account 模块依赖注入容器
 */
export class AccountContainer {
  private static instance: AccountContainer;
  private accountRepository: IAccountRepository | null = null;

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
    AccountContainer.instance = new AccountContainer();
  }

  /**
   * 注册 AccountRepository
   */
  registerAccountRepository(repository: IAccountRepository): this {
    this.accountRepository = repository;
    return this;
  }

  /**
   * 获取 AccountRepository
   */
  getAccountRepository(): IAccountRepository {
    if (!this.accountRepository) {
      throw new Error('AccountRepository not registered. Call registerAccountRepository first.');
    }
    return this.accountRepository;
  }

  /**
   * 检查是否已配置
   */
  isConfigured(): boolean {
    return this.accountRepository !== null;
  }

  /**
   * 清空所有注册的依赖
   */
  clear(): void {
    this.accountRepository = null;
  }
}
