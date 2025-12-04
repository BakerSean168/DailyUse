/**
 * Update Phone
 *
 * 更新手机号用例
 */

import type { AccountDTO, UpdatePhoneRequestDTO } from '@dailyuse/contracts/account';
import type { IAccountApiClient } from '@dailyuse/infrastructure-client';
import { AccountContainer } from '../AccountContainer';

/**
 * Update Phone Input
 */
export interface UpdatePhoneInput {
  accountId: string;
  request: UpdatePhoneRequestDTO;
}

/**
 * Update Phone
 */
export class UpdatePhone {
  private static instance: UpdatePhone;

  private constructor(private readonly apiClient: IAccountApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAccountApiClient): UpdatePhone {
    const container = AccountContainer.getInstance();
    const client = apiClient || container.getAccountApiClient();
    UpdatePhone.instance = new UpdatePhone(client);
    return UpdatePhone.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): UpdatePhone {
    if (!UpdatePhone.instance) {
      UpdatePhone.instance = UpdatePhone.createInstance();
    }
    return UpdatePhone.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    UpdatePhone.instance = undefined as unknown as UpdatePhone;
  }

  /**
   * 执行用例
   */
  async execute(input: UpdatePhoneInput): Promise<AccountDTO> {
    return this.apiClient.updatePhone(input.accountId, input.request);
  }
}

/**
 * 便捷函数
 */
export const updatePhone = (input: UpdatePhoneInput): Promise<AccountDTO> =>
  UpdatePhone.getInstance().execute(input);
