/**
 * Account Container
 *
 * 依赖注入容器，管理 Account 模块的 repository 实例
 */

import type { IAccountRepository } from '@dailyuse/domain-server/account';
import type { IAuthCredentialRepository } from '@dailyuse/domain-server/authentication';

/**
 * Account 模块依赖注入容器
 */
export class AccountContainer {
  private static instance: AccountContainer;
  private accountRepository: IAccountRepository | null = null;
  private authCredentialRepository: IAuthCredentialRepository | null = null;

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
  registerAccountRepository(repository: IAccountRepository): void {
    this.accountRepository = repository;
  }

  /**
   * 注册 AuthCredentialRepository
   */
  registerAuthCredentialRepository(repository: IAuthCredentialRepository): void {
    this.authCredentialRepository = repository;
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
   * 获取 AuthCredentialRepository
   */
  getAuthCredentialRepository(): IAuthCredentialRepository {
    if (!this.authCredentialRepository) {
      throw new Error('AuthCredentialRepository not registered. Call registerAuthCredentialRepository first.');
    }
    return this.authCredentialRepository;
  }
}
