/**
 * Verify 2FA Use Case
 *
 * 验证两步验证码用例
 */

import type { Verify2FARequest } from '@dailyuse/contracts/authentication';
import type { IAuthApiClient } from '@dailyuse/infrastructure-client';
import { AuthenticationContainer } from '../AuthenticationContainer';

export interface Verify2FAInput extends Verify2FARequest {}

/**
 * Verify 2FA Use Case
 */
export class Verify2FA {
  private static instance: Verify2FA;

  private constructor(private readonly apiClient: IAuthApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAuthApiClient): Verify2FA {
    const container = AuthenticationContainer.getInstance();
    const client = apiClient || container.getAuthApiClient();
    Verify2FA.instance = new Verify2FA(client);
    return Verify2FA.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): Verify2FA {
    if (!Verify2FA.instance) {
      Verify2FA.instance = Verify2FA.createInstance();
    }
    return Verify2FA.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    Verify2FA.instance = undefined as unknown as Verify2FA;
  }

  /**
   * 执行用例
   */
  async execute(input: Verify2FAInput): Promise<void> {
    return this.apiClient.verify2FA(input);
  }
}

/**
 * 便捷函数
 */
export const verify2FA = (input: Verify2FAInput): Promise<void> =>
  Verify2FA.getInstance().execute(input);
