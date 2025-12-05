/**
 * Update Email
 *
 * 更新邮箱用例
 */

import type { AccountDTO, UpdateEmailRequestDTO } from '@dailyuse/contracts/account';
import type { IAccountApiClient } from '@dailyuse/infrastructure-client';
import { AccountContainer } from '@dailyuse/infrastructure-client';

/**
 * Update Email Input
 */
export interface UpdateEmailInput {
  accountId: string;
  request: UpdateEmailRequestDTO;
}

/**
 * Update Email
 */
export class UpdateEmail {
  private static instance: UpdateEmail;

  private constructor(private readonly apiClient: IAccountApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAccountApiClient): UpdateEmail {
    const container = AccountContainer.getInstance();
    const client = apiClient || container.getApiClient();
    UpdateEmail.instance = new UpdateEmail(client);
    return UpdateEmail.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): UpdateEmail {
    if (!UpdateEmail.instance) {
      UpdateEmail.instance = UpdateEmail.createInstance();
    }
    return UpdateEmail.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    UpdateEmail.instance = undefined as unknown as UpdateEmail;
  }

  /**
   * 执行用例
   */
  async execute(input: UpdateEmailInput): Promise<AccountDTO> {
    return this.apiClient.updateEmail(input.accountId, input.request);
  }
}

/**
 * 便捷函数
 */
export const updateEmail = (input: UpdateEmailInput): Promise<AccountDTO> =>
  UpdateEmail.getInstance().execute(input);
