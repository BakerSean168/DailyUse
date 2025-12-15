/**
 * Account DI Container - 账户模块依赖注入容器
 * 
 * @module renderer/modules/account/infrastructure/di
 */

import {
  RendererContainer,
  createServiceToken,
  ModuleName,
} from '@/renderer/shared/infrastructure/di';

import {
  AccountIPCClient,
  accountIPCClient,
} from '../ipc/account.ipc-client';

// ============ Service Tokens ============

export const AccountTokens = {
  AccountIPCClient: createServiceToken<AccountIPCClient>('account:ipc-client'),
} as const;

// ============ Container ============

/**
 * Account Container - 账户模块容器
 */
export class AccountContainer extends RendererContainer {
  readonly moduleName = ModuleName.Account;

  protected registerServices(): void {
    // Register IPC Clients
    this.registerInstance(AccountTokens.AccountIPCClient, accountIPCClient);
  }

  // ============ Service Accessors ============

  get accountClient(): AccountIPCClient {
    return this.get(AccountTokens.AccountIPCClient);
  }

  get accountIPCClient(): AccountIPCClient {
    return this.get(AccountTokens.AccountIPCClient);
  }
}

// ============ Singleton Export ============
export const accountContainer = new AccountContainer();
