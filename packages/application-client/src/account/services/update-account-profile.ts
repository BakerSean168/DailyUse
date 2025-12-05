/**
 * Update Account Profile
 *
 * 更新账户资料用例
 */

import type { AccountDTO, UpdateAccountProfileRequestDTO } from '@dailyuse/contracts/account';
import type { IAccountApiClient } from '@dailyuse/infrastructure-client';
import { AccountContainer } from '@dailyuse/infrastructure-client';

/**
 * Update Account Profile Input
 */
export interface UpdateAccountProfileInput {
  accountId: string;
  request: UpdateAccountProfileRequestDTO;
}

/**
 * Update Account Profile
 */
export class UpdateAccountProfile {
  private static instance: UpdateAccountProfile;

  private constructor(private readonly apiClient: IAccountApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAccountApiClient): UpdateAccountProfile {
    const container = AccountContainer.getInstance();
    const client = apiClient || container.getAccountApiClient();
    UpdateAccountProfile.instance = new UpdateAccountProfile(client);
    return UpdateAccountProfile.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): UpdateAccountProfile {
    if (!UpdateAccountProfile.instance) {
      UpdateAccountProfile.instance = UpdateAccountProfile.createInstance();
    }
    return UpdateAccountProfile.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    UpdateAccountProfile.instance = undefined as unknown as UpdateAccountProfile;
  }

  /**
   * 执行用例
   */
  async execute(input: UpdateAccountProfileInput): Promise<AccountDTO> {
    return this.apiClient.updateProfile(input.accountId, input.request);
  }
}

/**
 * 便捷函数
 */
export const updateAccountProfile = (input: UpdateAccountProfileInput): Promise<AccountDTO> =>
  UpdateAccountProfile.getInstance().execute(input);
