/**
 * Get My Profile
 *
 * 获取当前用户资料用例
 */

import type { AccountDTO } from '@dailyuse/contracts/account';
import type { IAccountApiClient } from '@dailyuse/infrastructure-client';
import { AccountContainer } from '@dailyuse/infrastructure-client';

/**
 * Get My Profile
 */
export class GetMyProfile {
  private static instance: GetMyProfile;

  private constructor(private readonly apiClient: IAccountApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAccountApiClient): GetMyProfile {
    const container = AccountContainer.getInstance();
    const client = apiClient || container.getApiClient();
    GetMyProfile.instance = new GetMyProfile(client);
    return GetMyProfile.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetMyProfile {
    if (!GetMyProfile.instance) {
      GetMyProfile.instance = GetMyProfile.createInstance();
    }
    return GetMyProfile.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetMyProfile.instance = undefined as unknown as GetMyProfile;
  }

  /**
   * 执行用例
   */
  async execute(): Promise<AccountDTO> {
    return this.apiClient.getMyProfile();
  }
}

/**
 * 便捷函数
 */
export const getMyProfile = (): Promise<AccountDTO> =>
  GetMyProfile.getInstance().execute();
