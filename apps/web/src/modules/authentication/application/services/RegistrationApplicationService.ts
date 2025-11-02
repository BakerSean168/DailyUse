/**
 * Registration Application Service
 * 注册应用服务 - 负责用户注册相关的用例
 */

import type { AuthenticationContracts } from '@dailyuse/contracts';
import { useAuthStore } from '../../presentation/stores/authStore';
import { authApiClient } from '../../infrastructure/api/authApiClient';

export class RegistrationApplicationService {
  private static instance: RegistrationApplicationService;

  private constructor() {}

  /**
   * 创建应用服务实例
   */
  static createInstance(): RegistrationApplicationService {
    RegistrationApplicationService.instance = new RegistrationApplicationService();
    return RegistrationApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static getInstance(): RegistrationApplicationService {
    if (!RegistrationApplicationService.instance) {
      RegistrationApplicationService.instance = RegistrationApplicationService.createInstance();
    }
    return RegistrationApplicationService.instance;
  }

  /**
   * 懒加载获取 Auth Store
   */
  private get authStore(): ReturnType<typeof useAuthStore> {
    return useAuthStore();
  }

  // ============ 注册用例 ============

  /**
   * 用户注册
   * 
   * ⚠️ 注意：当前后端采用事件驱动架构，注册接口只返回 account 信息
   * 前端需要在注册成功后引导用户登录
   * 
   * @returns 包含账户信息和提示消息
   */
  async register(
    request: AuthenticationContracts.RegisterRequestDTO,
  ): Promise<{ account: any; message: string }> {
    try {
      this.authStore.setLoading(true);
      this.authStore.clearError();

      const response = await authApiClient.register(request);

      // ⚠️ 注册成功，但不自动登录（后端不返回 token）
      // 返回账户信息和消息，由调用方决定下一步操作
      return response; // { account: AccountClientDTO, message: string }
    } catch (error) {
      console.error('Registration failed:', error);
      this.authStore.setError('Registration failed');
      throw error;
    } finally {
      this.authStore.setLoading(false);
    }
  }
}

// 导出单例
export const registrationApplicationService = RegistrationApplicationService.getInstance();
