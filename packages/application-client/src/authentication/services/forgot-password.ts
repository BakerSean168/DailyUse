/**
 * Forgot Password Use Case
 *
 * 忘记密码 - 发送重置邮件用例
 */

import type { ForgotPasswordRequest } from '@dailyuse/contracts/authentication';
import type { IAuthApiClient } from '@dailyuse/infrastructure-client';
import { AuthenticationContainer } from '../AuthenticationContainer';

export interface ForgotPasswordInput extends ForgotPasswordRequest {}

/**
 * Forgot Password Use Case
 */
export class ForgotPassword {
  private static instance: ForgotPassword;

  private constructor(private readonly apiClient: IAuthApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAuthApiClient): ForgotPassword {
    const container = AuthenticationContainer.getInstance();
    const client = apiClient || container.getAuthApiClient();
    ForgotPassword.instance = new ForgotPassword(client);
    return ForgotPassword.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ForgotPassword {
    if (!ForgotPassword.instance) {
      ForgotPassword.instance = ForgotPassword.createInstance();
    }
    return ForgotPassword.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ForgotPassword.instance = undefined as unknown as ForgotPassword;
  }

  /**
   * 执行用例
   */
  async execute(input: ForgotPasswordInput): Promise<void> {
    return this.apiClient.forgotPassword(input);
  }
}

/**
 * 便捷函数
 */
export const forgotPassword = (input: ForgotPasswordInput): Promise<void> =>
  ForgotPassword.getInstance().execute(input);
