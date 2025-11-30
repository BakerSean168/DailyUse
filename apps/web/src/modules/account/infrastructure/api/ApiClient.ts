/**
 * 账户管理API服务
 * 基于新的API客户端系统，提供类型安全的账户相关API调用
 */

// @ts-nocheck - Some response types not yet defined in contracts
import { api, publicApiClient } from '../../../../shared/api/instances';
import type {
  RequestOptions,
  PaginatedData,
  UploadOptions,
} from '../../../../shared/api/core/types';
import type { AccountClientDTO, UpdateAccountRequest } from '@dailyuse/contracts/account';

// 使用 AccountContracts 命名空间中的类型

// 注册相关类型
type RegistrationByUsernameAndPasswordRequestDTO = CreateAccountRequestDTO;
type RegistrationResponseDTO = AccountCreationResponse;

// 查询参数类型（使用通用的分页查询）
interface AccountQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  accountType?: string;
  search?: string;
}

// 通用响应类型
interface SuccessResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
}

// 重新导出常用类型（使用新的类型名）
export type AccountInfo = AccountDTO;
export type { CreateAccountRequestDTO, UpdateAccountRequest, AccountQueryParams };
export type EmailVerifyRequest = VerifyEmailRequestDTO;
export type PhoneVerifyRequest = VerifyPhoneRequestDTO;

/**
 * 账户管理API服务
 * 负责与后端API的通信，提供完整的账户管理功能
 */
export class AccountApiService {
  /**
   * 测试连接
   */
  static async testConnection(): Promise<string> {
    return publicApiClient.get('/health');
  }

  /**
   * 用户注册
   */
  static async register(
    accountData: RegistrationByUsernameAndPasswordRequestDTO,
    options?: RequestOptions,
  ): Promise<RegistrationResponseDTO> {
    return publicApiClient.post('/accounts', accountData, options);
  }

  /**
   * 创建账户
   */
  static async createAccount(
    data: CreateAccountRequestDTO,
    options?: RequestOptions,
  ): Promise<AccountInfo> {
    return api.post('/accounts', data, options);
  }

  /**
   * 根据ID获取账户
   */
  static async getAccountById(id: string, options?: RequestOptions): Promise<AccountDTO | null> {
    return api.get(`/accounts/${id}`, options);
  }

  /**
   * 根据用户名获取账户
   */
  static async getAccountByUsername(
    username: string,
    options?: RequestOptions,
  ): Promise<AccountInfo> {
    return api.get(`/accounts/username/${username}`, options);
  }

  /**
   * 更新账户信息
   */
  static async updateAccount(
    id: string,
    data: UpdateAccountRequest,
    options?: RequestOptions,
  ): Promise<AccountInfo> {
    return api.put(`/accounts/${id}`, data, options);
  }

  /**
   * 激活账户
   */
  static async activateAccount(id: string, options?: RequestOptions): Promise<void> {
    return api.post(`/accounts/${id}/activate`, {}, options);
  }

  /**
   * 停用账户
   */
  static async deactivateAccount(id: string, options?: RequestOptions): Promise<void> {
    return api.post(`/accounts/${id}/deactivate`, {}, options);
  }

  /**
   * 暂停账户
   */
  static async suspendAccount(id: string, options?: RequestOptions): Promise<void> {
    return api.post(`/accounts/${id}/suspend`, {}, options);
  }

  /**
   * 验证邮箱
   */
  static async verifyEmail(
    id: string,
    data: EmailVerifyRequest,
    options?: RequestOptions,
  ): Promise<void> {
    return api.post(`/accounts/${id}/verify-email`, data, options);
  }

  /**
   * 验证手机号
   */
  static async verifyPhone(
    id: string,
    data: PhoneVerifyRequest,
    options?: RequestOptions,
  ): Promise<void> {
    return api.post(`/accounts/${id}/verify-phone`, data, options);
  }

  /**
   * 获取账户列表（分页）
   */
  static async getAccounts(
    params?: Partial<AccountQueryParams>,
    options?: RequestOptions,
  ): Promise<PaginatedData<AccountInfo>> {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    const url = queryString ? `/accounts?${queryString}` : '/accounts';
    return api.get(url, options);
  }

  /**
   * 搜索账户
   */
  static async searchAccounts(keyword: string, options?: RequestOptions): Promise<AccountInfo[]> {
    return api.get(`/accounts/search?q=${encodeURIComponent(keyword)}`, options);
  }

  /**
   * 删除账户（软删除）
   */
  static async deleteAccount(id: string, options?: RequestOptions): Promise<void> {
    return api.delete(`/accounts/${id}`, options);
  }

  /**
   * 上传头像
   */
  static async uploadAvatar(
    id: string,
    file: File,
    options?: UploadOptions,
  ): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', file);

    return api.upload(`/accounts/${id}/avatar`, formData, {
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
      ...options,
    });
  }
}

/**
 * @deprecated 旧的ApiClient类已废弃，请使用AccountApiService
 */
export class ApiClient {
  static async testConnection(): Promise<string> {
    return AccountApiService.testConnection();
  }

  static async register(
    accountData: RegistrationByUsernameAndPasswordRequestDTO,
  ): Promise<SuccessResponse<RegistrationResponseDTO>> {
    const result = await AccountApiService.register(accountData);
    // 包装成标准响应格式以保持兼容性
    return {
      status: 'SUCCESS',
      success: true,
      message: 'Registration successful',
      data: result,
      metadata: {
        timestamp: Date.now(),
      },
    } as SuccessResponse<RegistrationResponseDTO>;
  }
}

