/**
 * Password Management Application Service
 * 密码管理应用服务 - 负责密码相关的用例
 */

import type { LoginRequest, RegisterRequest, AuthTokens } from '@dailyuse/contracts/authentication';
import { useAuthStore } from '../../presentation/stores/authStore';
import { authApiClient } from '../../infrastructure/api/authApiClient';

export class PasswordApplicationService {
  private static instance: PasswordApplicationService;

  private constructor() {}

  static createInstance(): PasswordApplicationService {
    PasswordApplicationService.instance = new PasswordApplicationService();
    return PasswordApplicationService.instance;
  }

  static getInstance(): PasswordApplicationService {
    if (!PasswordApplicationService.instance) {
      PasswordApplicationService.instance = PasswordApplicationService.createInstance();
    }
    return PasswordApplicationService.instance;
  }

  private get authStore(): ReturnType<typeof useAuthStore> {
    return useAuthStore();
  }

  // ============ 密码管理用例 ============

  async forgotPassword(request: ForgotPasswordRequestDTO): Promise<void> {
    try {
      this.authStore.setLoading(true);
      await authApiClient.forgotPassword(request);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw error;
    } finally {
      this.authStore.setLoading(false);
    }
  }

  async resetPassword(request: ResetPasswordRequestDTO): Promise<void> {
    try {
      this.authStore.setLoading(true);
      await authApiClient.resetPassword(request);
    } catch (error) {
      console.error('Failed to reset password:', error);
      throw error;
    } finally {
      this.authStore.setLoading(false);
    }
  }

  async changePassword(request: ChangePasswordRequestDTO): Promise<void> {
    try {
      this.authStore.setLoading(true);
      await authApiClient.changePassword(request);
    } catch (error) {
      console.error('Failed to change password:', error);
      throw error;
    } finally {
      this.authStore.setLoading(false);
    }
  }

  // ============ 两步验证管理 ============

  async enable2FA(
    request: Enable2FARequestDTO,
  ): Promise<Enable2FAResponseDTO> {
    try {
      this.authStore.setLoading(true);
      const response = await authApiClient.enable2FA(request);
      
      // 保存两步验证设置信息
      if (response.secret && response.qrCodeUrl && response.backupCodes) {
        this.authStore.setTwoFactorSetup(
          response.secret,
          response.qrCodeUrl,
          response.backupCodes,
        );
      }
      
      return response;
    } catch (error) {
      console.error('Failed to enable 2FA:', error);
      throw error;
    } finally {
      this.authStore.setLoading(false);
    }
  }

  async disable2FA(request: Disable2FARequestDTO): Promise<void> {
    try {
      this.authStore.setLoading(true);
      await authApiClient.disable2FA(request);
      this.authStore.clearTwoFactorSetup();
    } catch (error) {
      console.error('Failed to disable 2FA:', error);
      throw error;
    } finally {
      this.authStore.setLoading(false);
    }
  }

  async verify2FA(request: Verify2FARequestDTO): Promise<void> {
    try {
      this.authStore.setLoading(true);
      await authApiClient.verify2FA(request);
    } catch (error) {
      console.error('Failed to verify 2FA code:', error);
      throw error;
    } finally {
      this.authStore.setLoading(false);
    }
  }
}

export const passwordApplicationService = PasswordApplicationService.getInstance();

