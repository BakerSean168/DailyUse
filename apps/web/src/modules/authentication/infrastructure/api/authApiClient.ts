import { apiClient } from '@/shared/api/instances';
import type { AuthenticationContracts } from '@dailyuse/contracts';

/**
 * Authentication API 客户端
 * 负责认证相关的 API 调用
 *
 * API 路由设计:
 * - POST   /auth/login                  - 登录
 * - POST   /auth/register               - 注册
 * - POST   /auth/logout                 - 登出
 * - POST   /auth/refresh-token          - 刷新令牌
 * - POST   /auth/forgot-password        - 忘记密码
 * - POST   /auth/reset-password         - 重置密码
 * - POST   /auth/change-password        - 修改密码
 * - POST   /auth/2fa/enable             - 启用两步验证
 * - POST   /auth/2fa/disable            - 禁用两步验证
 * - POST   /auth/2fa/verify             - 验证两步验证码
 * - POST   /auth/api-keys               - 创建 API Key
 * - GET    /auth/api-keys               - 获取 API Key 列表
 * - DELETE /auth/api-keys/:id           - 撤销 API Key
 * - GET    /auth/sessions               - 获取活跃会话列表
 * - DELETE /auth/sessions/:id           - 撤销会话
 * - DELETE /auth/sessions               - 撤销所有会话
 * - POST   /auth/devices/trust          - 信任设备
 * - DELETE /auth/devices/:id            - 撤销设备信任
 * - GET    /auth/devices/trusted        - 获取受信任设备列表
 */
export class AuthApiClient {
  private readonly baseUrl = '/auth';

  // ============ 认证核心功能 ============

  /**
   * 登录
   */
  async login(
    request: AuthenticationContracts.LoginRequestDTO,
  ): Promise<AuthenticationContracts.LoginResponseDTO> {
    const data = await apiClient.post(`${this.baseUrl}/login`, request);
    return data;
  }

  /**
   * 注册
   * 
   * ⚠️ 注意：使用 postWithMessage 保留后端返回的 message
   * 因为注册接口返回的 message 包含重要提示信息
   */
  async register(
    request: AuthenticationContracts.RegisterRequestDTO,
  ): Promise<{ account: any; message: string }> {
    const response = await apiClient.postWithMessage(`${this.baseUrl}/register`, request);
    return {
      account: response.data.account,
      message: response.message,
    };
  }

  /**
   * 登出
   */
  async logout(request?: AuthenticationContracts.LogoutRequestDTO): Promise<void> {
    await apiClient.post(`${this.baseUrl}/logout`, request);
  }

  /**
   * 刷新令牌
   */
  async refreshToken(
    request: AuthenticationContracts.RefreshTokenRequestDTO,
  ): Promise<AuthenticationContracts.RefreshTokenResponseDTO> {
    const data = await apiClient.post(`${this.baseUrl}/refresh-token`, request);
    return data;
  }

  // ============ 密码管理 ============

  /**
   * 忘记密码（发送重置邮件）
   */
  async forgotPassword(request: AuthenticationContracts.ForgotPasswordRequestDTO): Promise<void> {
    await apiClient.post(`${this.baseUrl}/forgot-password`, request);
  }

  /**
   * 重置密码
   */
  async resetPassword(request: AuthenticationContracts.ResetPasswordRequestDTO): Promise<void> {
    await apiClient.post(`${this.baseUrl}/reset-password`, request);
  }

  /**
   * 修改密码
   */
  async changePassword(request: AuthenticationContracts.ChangePasswordRequestDTO): Promise<void> {
    await apiClient.post(`${this.baseUrl}/change-password`, request);
  }

  // ============ 两步验证 ============

  /**
   * 启用两步验证
   */
  async enable2FA(
    request: AuthenticationContracts.Enable2FARequestDTO,
  ): Promise<AuthenticationContracts.Enable2FAResponseDTO> {
    const data = await apiClient.post(`${this.baseUrl}/2fa/enable`, request);
    return data;
  }

  /**
   * 禁用两步验证
   */
  async disable2FA(request: AuthenticationContracts.Disable2FARequestDTO): Promise<void> {
    await apiClient.post(`${this.baseUrl}/2fa/disable`, request);
  }

  /**
   * 验证两步验证码
   */
  async verify2FA(request: AuthenticationContracts.Verify2FARequestDTO): Promise<void> {
    await apiClient.post(`${this.baseUrl}/2fa/verify`, request);
  }

  // ============ API Key 管理 ============

  /**
   * 创建 API Key
   */
  async createApiKey(
    request: AuthenticationContracts.CreateApiKeyRequestDTO,
  ): Promise<AuthenticationContracts.CreateApiKeyResponseDTO> {
    const data = await apiClient.post(`${this.baseUrl}/api-keys`, request);
    return data;
  }

  /**
   * 获取 API Key 列表
   */
  async getApiKeys(): Promise<AuthenticationContracts.ApiKeyListResponseDTO> {
    const data = await apiClient.get(`${this.baseUrl}/api-keys`);
    return data;
  }

  /**
   * 撤销 API Key
   */
  async revokeApiKey(request: AuthenticationContracts.RevokeApiKeyRequestDTO): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/api-keys/${request.apiKeyId}`);
  }

  // ============ 会话管理 ============

  /**
   * 获取活跃会话列表
   */
  async getActiveSessions(
    request?: AuthenticationContracts.GetActiveSessionsRequestDTO,
  ): Promise<AuthenticationContracts.ActiveSessionsResponseDTO> {
    const data = await apiClient.get(`${this.baseUrl}/sessions`, { params: request });
    return data;
  }

  /**
   * 撤销会话
   */
  async revokeSession(request: AuthenticationContracts.RevokeSessionRequestDTO): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/sessions/${request.sessionId}`);
  }

  /**
   * 撤销所有会话
   */
  async revokeAllSessions(
    request?: AuthenticationContracts.RevokeAllSessionsRequestDTO,
  ): Promise<void> {
    await apiClient.post(`${this.baseUrl}/sessions/revoke-all`, request);
  }

  // ============ 设备管理 ============

  /**
   * 信任设备
   */
  async trustDevice(request: AuthenticationContracts.TrustDeviceRequestDTO): Promise<void> {
    await apiClient.post(`${this.baseUrl}/devices/trust`, request);
  }

  /**
   * 撤销设备信任
   */
  async revokeTrustedDevice(
    request: AuthenticationContracts.RevokeTrustedDeviceRequestDTO,
  ): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/devices/${request.deviceId}`);
  }

  /**
   * 获取受信任设备列表
   */
  async getTrustedDevices(): Promise<AuthenticationContracts.TrustedDevicesResponseDTO> {
    const data = await apiClient.get(`${this.baseUrl}/devices/trusted`);
    return data;
  }
}

// 导出单例
export const authApiClient = new AuthApiClient();
