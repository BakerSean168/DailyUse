/**
 * Deactivate Account
 *
 * 停用账户用例
 */

import type { AccountDTO } from '@dailyuse/contracts/account';
import type { IAccountApiClient } from '@dailyuse/infrastructure-client';
import { AccountContainer } from '../AccountContainer';

/**
 * Deactivate Account
 */
export class DeactivateAccount {
  private static instance: DeactivateAccount;

  private constructor(private readonly apiClient: IAccountApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAccountApiClient): DeactivateAccount {
    const container = AccountContainer.getInstance();
    const client = apiClient || container.getAccountApiClient();
    DeactivateAccount.instance = new DeactivateAccount(client);
    return DeactivateAccount.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): DeactivateAccount {
    if (!DeactivateAccount.instance) {
      DeactivateAccount.instance = DeactivateAccount.createInstance();
    }
    return DeactivateAccount.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    DeactivateAccount.instance = undefined as unknown as DeactivateAccount;
  }

  /**
   * 执行用例
   */
  async execute(accountId: string): Promise<AccountDTO> {
    return this.apiClient.deactivateAccount(accountId);
  }
}

/**
 * 便捷函数
 */
export const deactivateAccount = (accountId: string): Promise<AccountDTO> =>
  DeactivateAccount.getInstance().execute(accountId);
