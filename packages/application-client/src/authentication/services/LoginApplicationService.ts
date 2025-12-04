/**
 * Login Application Service
 * 登录应用服务 - 负责登录相关的用例
 *
 * 🔄 包提取版本：
 * - 使用依赖注入的 IAuthApiClient
 * - 不依赖 Store（Store 操作由调用层负责）
 * - 返回纯数据，由调用层决定如何处理状态
 */

import type {
  LoginRequest,
  LoginResponseDTO,
  LogoutRequest,
  RefreshTokenRequest,
  RefreshTokenResponseDTO,
} from '@dailyuse/contracts/authentication';
import type { IAuthApiClient } from '@dailyuse/infrastructure-client/ports';

export class LoginApplicationService {
  constructor(private readonly authApiClient: IAuthApiClient) {}

  /**
   * 用户登录
   */
  async login(request: LoginRequest): Promise<LoginResponseDTO> {
    return this.authApiClient.login(request);
  }

  /**
   * 用户登出
   */
  async logout(request?: LogoutRequest): Promise<void> {
    return this.authApiClient.logout(request);
  }

  /**
   * 刷新访问令牌
   */
  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponseDTO> {
    return this.authApiClient.refreshToken(request);
  }
}

/**
 * 工厂函数 - 创建登录应用服务实例
 */
export function createLoginApplicationService(
  authApiClient: IAuthApiClient,
): LoginApplicationService {
  return new LoginApplicationService(authApiClient);
}
