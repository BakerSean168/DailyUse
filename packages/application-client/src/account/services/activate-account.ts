/**
 * Activate Account
 *
 * 激活账户用例
 */

import type { AccountDTO } from '@dailyuse/contracts/account';
import type { IAccountApiClient } from '@dailyuse/infrastructure-client';
import { AccountContainer } from '@dailyuse/infrastructure-client';

/**
 * Activate Account
 */
export class ActivateAccount {
  private static instance: ActivateAccount;

  private constructor(private readonly apiClient: IAccountApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAccountApiClient): ActivateAccount {
    const container = AccountContainer.getInstance();
    const client = apiClient || container.getAccountApiClient();
    ActivateAccount.instance = new ActivateAccount(client);
    return ActivateAccount.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ActivateAccount {
    if (!ActivateAccount.instance) {
      ActivateAccount.instance = ActivateAccount.createInstance();
    }
    return ActivateAccount.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ActivateAccount.instance = undefined as unknown as ActivateAccount;
  }

  /**
   * 执行用例
   */
  async execute(accountId: string): Promise<AccountDTO> {
    return this.apiClient.activateAccount(accountId);
  }
}

/**
 * 便捷函数
 */
export const activateAccount = (accountId: string): Promise<AccountDTO> =>
  ActivateAccount.getInstance().execute(accountId);
