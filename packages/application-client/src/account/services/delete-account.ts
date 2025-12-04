/**
 * Delete Account
 *
 * 删除账户用例
 */

import type { IAccountApiClient } from '@dailyuse/infrastructure-client';
import { AccountContainer } from '../AccountContainer';

/**
 * Delete Account
 */
export class DeleteAccount {
  private static instance: DeleteAccount;

  private constructor(private readonly apiClient: IAccountApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAccountApiClient): DeleteAccount {
    const container = AccountContainer.getInstance();
    const client = apiClient || container.getAccountApiClient();
    DeleteAccount.instance = new DeleteAccount(client);
    return DeleteAccount.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): DeleteAccount {
    if (!DeleteAccount.instance) {
      DeleteAccount.instance = DeleteAccount.createInstance();
    }
    return DeleteAccount.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    DeleteAccount.instance = undefined as unknown as DeleteAccount;
  }

  /**
   * 执行用例
   */
  async execute(accountId: string): Promise<void> {
    return this.apiClient.deleteAccount(accountId);
  }
}

/**
 * 便捷函数
 */
export const deleteAccount = (accountId: string): Promise<void> =>
  DeleteAccount.getInstance().execute(accountId);
