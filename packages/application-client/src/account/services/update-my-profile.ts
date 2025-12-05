/**
 * Update My Profile
 *
 * 更新当前用户资料用例
 */

import type { AccountDTO, UpdateAccountProfileRequestDTO } from '@dailyuse/contracts/account';
import type { IAccountApiClient } from '@dailyuse/infrastructure-client';
import { AccountContainer } from '@dailyuse/infrastructure-client';

/**
 * Update My Profile Input
 */
export type UpdateMyProfileInput = UpdateAccountProfileRequestDTO;

/**
 * Update My Profile
 */
export class UpdateMyProfile {
  private static instance: UpdateMyProfile;

  private constructor(private readonly apiClient: IAccountApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAccountApiClient): UpdateMyProfile {
    const container = AccountContainer.getInstance();
    const client = apiClient || container.getApiClient();
    UpdateMyProfile.instance = new UpdateMyProfile(client);
    return UpdateMyProfile.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): UpdateMyProfile {
    if (!UpdateMyProfile.instance) {
      UpdateMyProfile.instance = UpdateMyProfile.createInstance();
    }
    return UpdateMyProfile.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    UpdateMyProfile.instance = undefined as unknown as UpdateMyProfile;
  }

  /**
   * 执行用例
   */
  async execute(request: UpdateMyProfileInput): Promise<AccountDTO> {
    return this.apiClient.updateMyProfile(request);
  }
}

/**
 * 便捷函数
 */
export const updateMyProfile = (request: UpdateMyProfileInput): Promise<AccountDTO> =>
  UpdateMyProfile.getInstance().execute(request);
