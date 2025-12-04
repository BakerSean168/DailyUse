/**
 * Registration Application Service
 * 注册应用服务 - 负责用户注册相关的用例
 *
 * 🔄 包提取版本：
 * - 使用依赖注入的 IAuthApiClient
 * - 不依赖 Store（Store 操作由调用层负责）
 */

import type { RegisterRequest } from '@dailyuse/contracts/authentication';
import type { IAuthApiClient, RegisterResponse } from '@dailyuse/infrastructure-client';

export class RegistrationApplicationService {
  constructor(private readonly authApiClient: IAuthApiClient) {}

  /**
   * 用户注册
   *
   * ⚠️ 注意：当前后端采用事件驱动架构，注册接口只返回 account 信息
   * 前端需要在注册成功后引导用户登录
   */
  async register(request: RegisterRequest): Promise<RegisterResponse> {
    return this.authApiClient.register(request);
  }
}

/**
 * 工厂函数 - 创建注册应用服务实例
 */
export function createRegistrationApplicationService(
  authApiClient: IAuthApiClient,
): RegistrationApplicationService {
  return new RegistrationApplicationService(authApiClient);
}
