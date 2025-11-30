/**
 * 认证 API 客户端
 * 基于新的 API 客户端系统，提供类型安全的认证相关 API 调用
 * 使用标准的 Response DTO 格式（嵌套 data 结构）
 */

// @ts-nocheck - Some response types not yet defined in contracts
import { api } from '../../../../shared/api/instances';
import type { RequestOptions } from '../../../../shared/api/core/types';
import type { AuthTokens, LoginRequest } from '@dailyuse/contracts/authentication';
import type { AccountServerDTO } from '@dailyuse/contracts/account';

// 类型别名以简化使用

/**
 * 认证 API 服务类
 * 提供完整的认证功能，使用新的 Response DTO 格式
 */
export class AuthApiService {
  /**
   * 用户登录
   * POST /api/v1/auth/login
   * @returns 返回 LoginResponseDTO.data (解包后的数据)
   */
  static async login(data: LoginRequestDTO, options?: RequestOptions): Promise<LoginResponseDTO['data']> {
    return api.post('/auth/login', data, options);
  }

  /**
   * MFA 验证
   * POST /api/v1/auth/mfa/verify
   * @returns 返回 VerifyMFAResponse.data (解包后的数据)
   */
  static async verifyMFA(
    data: VerifyMFARequest,
    options?: RequestOptions,
  ): Promise<VerifyMFAResponse['data']> {
    return api.post('/auth/mfa/verify', data, options);
  }

  /**
   * 用户登出
   * POST /api/v1/auth/logout
   * @returns 返回 LogoutResponse.data (解包后的数据)
   */
  static async logout(options?: RequestOptions): Promise<LogoutResponse['data']> {
    return api.post('/auth/logout', {}, options);
  }

  /**
   * 刷新访问令牌
   * POST /api/v1/auth/refresh
   * @returns 返回 RefreshTokenResponseDTO.data (解包后的数据)
   */
  static async refreshToken(
    data: RefreshTokenRequestDTO,
    options?: RequestOptions,
  ): Promise<RefreshTokenResponseDTO['data']> {
    return api.post('/auth/refresh', data, options);
  }

  /**
   * 获取当前用户信息
   * GET /api/v1/auth/user
   */
  static async getCurrentUser(options?: RequestOptions): Promise<AccountClientDTO> {
    return api.get('/auth/user', options);
  }

  /**
   * 修改密码
   * POST /api/v1/auth/password/change
   * @returns 返回 PasswordChangeResponse.data (解包后的数据)
   */
  static async changePassword(
    data: ChangePasswordRequestDTO,
    options?: RequestOptions,
  ): Promise<PasswordChangeResponse['data']> {
    return api.post('/auth/change-password', data, options);
  }

  /**
   * 获取 MFA 设备列表
   * GET /api/v1/auth/mfa/devices
   * @returns 返回 MFADeviceListResponse.data (解包后的数据)
   */
  static async getMFADevices(options?: RequestOptions): Promise<MFADeviceListResponse['data']> {
    return api.get('/auth/mfa/devices', options);
  }

  /**
   * 创建 MFA 设备
   * POST /api/v1/auth/mfa/devices
   * @returns 返回 MFADeviceCreationResponse.data (解包后的数据)
   */
  static async createMFADevice(
    data: CreateMFADeviceRequest,
    options?: RequestOptions,
  ): Promise<MFADeviceCreationResponse['data']> {
    return api.post('/auth/mfa/devices', data, options);
  }

  /**
   * 删除 MFA 设备
   * DELETE /api/v1/auth/mfa/devices/:deviceId
   */
  static async deleteMFADevice(deviceId: string, options?: RequestOptions): Promise<void> {
    return api.delete(`/auth/mfa/devices/${deviceId}`, options);
  }

  /**
   * 获取用户会话列表
   * GET /api/v1/auth/sessions
   * @returns 返回 SessionListResponse.data (解包后的数据)
   */
  static async getSessions(options?: RequestOptions): Promise<SessionListResponse['data']> {
    return api.get('/auth/sessions', options);
  }

  /**
   * 终止指定会话
   * DELETE /api/v1/auth/sessions/:sessionId
   */
  static async terminateSession(sessionId: string, options?: RequestOptions): Promise<void> {
    return api.delete(`/auth/sessions/${sessionId}`, options);
  }

  /**
   * 终止其他所有会话
   * POST /api/v1/auth/sessions/terminate-others
   */
  static async terminateOtherSessions(options?: RequestOptions): Promise<void> {
    return api.post('/auth/sessions/terminate-others', {}, options);
  }
}




