/**
 * Password Management Application Service
 * 密码管理应用服务 - 负责密码和两步验证相关的用例
 *
 * 🔄 包提取版本：
 * - 使用依赖注入的 IAuthApiClient
 * - 不依赖 Store（Store 操作由调用层负责）
 */

import type {
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  Enable2FARequest,
  Enable2FAResponseDTO,
  Disable2FARequest,
  Verify2FARequest,
} from '@dailyuse/contracts/authentication';
import type { IAuthApiClient } from '@dailyuse/infrastructure-client/ports';

export class PasswordApplicationService {
  constructor(private readonly authApiClient: IAuthApiClient) {}

  // ============ 密码管理用例 ============

  /**
   * 忘记密码 - 发送重置邮件
   */
  async forgotPassword(request: ForgotPasswordRequest): Promise<void> {
    return this.authApiClient.forgotPassword(request);
  }

  /**
   * 重置密码
   */
  async resetPassword(request: ResetPasswordRequest): Promise<void> {
    return this.authApiClient.resetPassword(request);
  }

  /**
   * 修改密码
   */
  async changePassword(request: ChangePasswordRequest): Promise<void> {
    return this.authApiClient.changePassword(request);
  }

  // ============ 两步验证管理 ============

  /**
   * 启用两步验证
   */
  async enable2FA(request: Enable2FARequest): Promise<Enable2FAResponseDTO> {
    return this.authApiClient.enable2FA(request);
  }

  /**
   * 禁用两步验证
   */
  async disable2FA(request: Disable2FARequest): Promise<void> {
    return this.authApiClient.disable2FA(request);
  }

  /**
   * 验证两步验证码
   */
  async verify2FA(request: Verify2FARequest): Promise<void> {
    return this.authApiClient.verify2FA(request);
  }
}

/**
 * 工厂函数 - 创建密码应用服务实例
 */
export function createPasswordApplicationService(
  authApiClient: IAuthApiClient,
): PasswordApplicationService {
  return new PasswordApplicationService(authApiClient);
}
