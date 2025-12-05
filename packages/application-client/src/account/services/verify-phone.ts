/**
 * Verify Phone
 *
 * 验证手机号用例
 */

import type { AccountDTO, VerifyPhoneRequestDTO } from '@dailyuse/contracts/account';
import type { IAccountApiClient } from '@dailyuse/infrastructure-client';
import { AccountContainer } from '@dailyuse/infrastructure-client';

/**
 * Verify Phone Input
 */
export interface VerifyPhoneInput {
  accountId: string;
  request: VerifyPhoneRequestDTO;
}

/**
 * Verify Phone
 */
export class VerifyPhone {
  private static instance: VerifyPhone;

  private constructor(private readonly apiClient: IAccountApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAccountApiClient): VerifyPhone {
    const container = AccountContainer.getInstance();
    const client = apiClient || container.getAccountApiClient();
    VerifyPhone.instance = new VerifyPhone(client);
    return VerifyPhone.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): VerifyPhone {
    if (!VerifyPhone.instance) {
      VerifyPhone.instance = VerifyPhone.createInstance();
    }
    return VerifyPhone.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    VerifyPhone.instance = undefined as unknown as VerifyPhone;
  }

  /**
   * 执行用例
   */
  async execute(input: VerifyPhoneInput): Promise<AccountDTO> {
    return this.apiClient.verifyPhone(input.accountId, input.request);
  }
}

/**
 * 便捷函数
 */
export const verifyPhone = (input: VerifyPhoneInput): Promise<AccountDTO> =>
  VerifyPhone.getInstance().execute(input);
