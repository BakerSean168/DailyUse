/**
 * Login Use Case
 *
 * 用户登录用例
 */

import type { LoginRequest, LoginResponseDTO } from '@dailyuse/contracts/authentication';
import type { IAuthApiClient } from '@dailyuse/infrastructure-client';
import { AuthenticationContainer } from '@dailyuse/infrastructure-client';

export interface LoginInput extends LoginRequest {}

/**
 * Login Use Case
 */
export class Login {
  private static instance: Login;

  private constructor(private readonly apiClient: IAuthApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAuthApiClient): Login {
    const container = AuthenticationContainer.getInstance();
    const client = apiClient || container.getAuthApiClient();
    Login.instance = new Login(client);
    return Login.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): Login {
    if (!Login.instance) {
      Login.instance = Login.createInstance();
    }
    return Login.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    Login.instance = undefined as unknown as Login;
  }

  /**
   * 执行用例
   */
  async execute(input: LoginInput): Promise<LoginResponseDTO> {
    return this.apiClient.login(input);
  }
}

/**
 * 便捷函数
 */
export const login = (input: LoginInput): Promise<LoginResponseDTO> =>
  Login.getInstance().execute(input);
