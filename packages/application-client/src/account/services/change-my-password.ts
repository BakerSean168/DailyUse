/**
 * Change My Password
 *
 * 修改当前用户密码用例
 */

import type { IAccountApiClient } from '@dailyuse/infrastructure-client';
import { AccountContainer } from '../AccountContainer';

/**
 * Change My Password Input
 */
export interface ChangeMyPasswordInput {
  currentPassword: string;
  newPassword: string;
}

/**
 * Change My Password Result
 */
export interface ChangeMyPasswordResult {
  success: boolean;
  message: string;
}

/**
 * Change My Password
 */
export class ChangeMyPassword {
  private static instance: ChangeMyPassword;

  private constructor(private readonly apiClient: IAccountApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAccountApiClient): ChangeMyPassword {
    const container = AccountContainer.getInstance();
    const client = apiClient || container.getAccountApiClient();
    ChangeMyPassword.instance = new ChangeMyPassword(client);
    return ChangeMyPassword.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ChangeMyPassword {
    if (!ChangeMyPassword.instance) {
      ChangeMyPassword.instance = ChangeMyPassword.createInstance();
    }
    return ChangeMyPassword.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ChangeMyPassword.instance = undefined as unknown as ChangeMyPassword;
  }

  /**
   * 执行用例
   */
  async execute(input: ChangeMyPasswordInput): Promise<ChangeMyPasswordResult> {
    return this.apiClient.changeMyPassword(input);
  }
}

/**
 * 便捷函数
 */
export const changeMyPassword = (input: ChangeMyPasswordInput): Promise<ChangeMyPasswordResult> =>
  ChangeMyPassword.getInstance().execute(input);
