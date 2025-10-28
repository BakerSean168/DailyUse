/**
 * useAuth Composable
 * 认证 Composable 函数 - 纯数据传递层
 *
 * 职责：
 * - 封装 Store 的响应式状态
 * - 调用 ApplicationService 执行业务逻辑
 * - 不包含复杂的业务规则
 */

import { computed } from 'vue';
import { useAuthStore } from '../stores/authStore';
import {
  loginApplicationService,
  registrationApplicationService,
  sessionApplicationService,
  passwordApplicationService,
  apiKeyApplicationService,
} from '../../application/services';
import type { AuthenticationContracts } from '@dailyuse/contracts';

export function useAuth() {
  const authStore = useAuthStore();

  // ===== 响应式状态 =====

  const accessToken = computed(() => authStore.accessToken);
  const refreshToken = computed(() => authStore.refreshToken);
  const currentSessionId = computed(() => authStore.currentSessionId);
  const activeSessions = computed(() => authStore.activeSessions);
  const apiKeys = computed(() => authStore.apiKeys);
  const trustedDevices = computed(() => authStore.trustedDevices);
  const isLoading = computed(() => authStore.isLoading);
  const error = computed(() => authStore.error);
  const rememberedIdentifier = computed(() => authStore.rememberedIdentifier);

  // 两步验证
  const twoFactorSecret = computed(() => authStore.twoFactorSecret);
  const twoFactorQrCode = computed(() => authStore.twoFactorQrCode);
  const twoFactorBackupCodes = computed(() => authStore.twoFactorBackupCodes);

  // ===== 计算属性 =====

  const isAuthenticated = computed(() => authStore.isAuthenticated);
  const isTokenExpired = computed(() => authStore.isTokenExpired);
  const isTokenExpiringSoon = computed(() => authStore.isTokenExpiringSoon);
  const sessionCount = computed(() => authStore.sessionCount);
  const apiKeyCount = computed(() => authStore.apiKeyCount);
  const trustedDeviceCount = computed(() => authStore.trustedDeviceCount);

  // ===== 认证核心功能 =====

  /**
   * 登录
   */
  async function login(
    request: AuthenticationContracts.LoginRequestDTO,
  ): Promise<AuthenticationContracts.LoginResponseDTO> {
    const response = await loginApplicationService.login(request);
    
    // 如果记住登录，保存标识符
    if (request.rememberMe) {
      authStore.rememberIdentifier(request.identifier);
    }
    
    return response;
  }

  /**
   * 注册
   * 
   * @returns 包含账户信息和提示消息
   */
  async function register(
    request: AuthenticationContracts.RegisterRequestDTO,
  ): Promise<{ account: any; message: string }> {
    return await registrationApplicationService.register(request);
  }

  /**
   * 登出
   */
  async function logout(request?: AuthenticationContracts.LogoutRequestDTO): Promise<void> {
    await loginApplicationService.logout(request);
  }

  /**
   * 刷新令牌
   */
  async function refreshAccessToken(): Promise<void> {
    await loginApplicationService.refreshAccessToken();
  }

  /**
   * 检查并刷新令牌（如果即将过期）
   */
  async function checkAndRefreshToken(): Promise<void> {
    await loginApplicationService.checkAndRefreshToken();
  }

  // ===== 密码管理 =====

  /**
   * 忘记密码
   */
  async function forgotPassword(
    request: AuthenticationContracts.ForgotPasswordRequestDTO,
  ): Promise<void> {
    await passwordApplicationService.forgotPassword(request);
  }

  /**
   * 重置密码
   */
  async function resetPassword(
    request: AuthenticationContracts.ResetPasswordRequestDTO,
  ): Promise<void> {
    await passwordApplicationService.resetPassword(request);
  }

  /**
   * 修改密码
   */
  async function changePassword(
    request: AuthenticationContracts.ChangePasswordRequestDTO,
  ): Promise<void> {
    await passwordApplicationService.changePassword(request);
  }

  // ===== 两步验证 =====

  /**
   * 启用两步验证
   */
  async function enable2FA(
    request: AuthenticationContracts.Enable2FARequestDTO,
  ): Promise<AuthenticationContracts.Enable2FAResponseDTO> {
    return await passwordApplicationService.enable2FA(request);
  }

  /**
   * 禁用两步验证
   */
  async function disable2FA(request: AuthenticationContracts.Disable2FARequestDTO): Promise<void> {
    await passwordApplicationService.disable2FA(request);
  }

  /**
   * 验证两步验证码
   */
  async function verify2FA(request: AuthenticationContracts.Verify2FARequestDTO): Promise<void> {
    await passwordApplicationService.verify2FA(request);
  }

  // ===== 会话管理 =====

  /**
   * 获取活跃会话列表
   */
  async function getActiveSessions(
    request?: AuthenticationContracts.GetActiveSessionsRequestDTO,
  ): Promise<AuthenticationContracts.ActiveSessionsResponseDTO> {
    return await sessionApplicationService.getActiveSessions(request);
  }

  /**
   * 撤销会话
   */
  async function revokeSession(
    request: AuthenticationContracts.RevokeSessionRequestDTO,
  ): Promise<void> {
    await sessionApplicationService.revokeSession(request);
  }

  /**
   * 撤销所有会话
   */
  async function revokeAllSessions(
    request?: AuthenticationContracts.RevokeAllSessionsRequestDTO,
  ): Promise<void> {
    await sessionApplicationService.revokeAllSessions(request);
  }

  // ===== 设备管理 =====

  /**
   * 获取受信任设备列表
   */
  async function getTrustedDevices(): Promise<AuthenticationContracts.TrustedDevicesResponseDTO> {
    return await sessionApplicationService.getTrustedDevices();
  }

  /**
   * 信任设备
   */
  async function trustDevice(request: AuthenticationContracts.TrustDeviceRequestDTO): Promise<void> {
    await sessionApplicationService.trustDevice(request);
  }

  /**
   * 撤销设备信任
   */
  async function revokeTrustedDevice(
    request: AuthenticationContracts.RevokeTrustedDeviceRequestDTO,
  ): Promise<void> {
    await sessionApplicationService.revokeTrustedDevice(request);
  }

  // ===== API Key 管理 =====

  /**
   * 创建 API Key
   */
  async function createApiKey(
    request: AuthenticationContracts.CreateApiKeyRequestDTO,
  ): Promise<AuthenticationContracts.CreateApiKeyResponseDTO> {
    return await apiKeyApplicationService.createApiKey(request);
  }

  /**
   * 获取 API Key 列表
   */
  async function getApiKeys(): Promise<AuthenticationContracts.ApiKeyListResponseDTO> {
    return await apiKeyApplicationService.getApiKeys();
  }

  /**
   * 撤销 API Key
   */
  async function revokeApiKey(
    request: AuthenticationContracts.RevokeApiKeyRequestDTO,
  ): Promise<void> {
    await apiKeyApplicationService.revokeApiKey(request);
  }

  // ===== Store 操作 =====

  /**
   * 清除认证状态
   */
  function clearAuth() {
    authStore.clearAuth();
  }

  /**
   * 完全清除（包括记住的信息）
   */
  function clearAll() {
    authStore.clearAll();
  }

  /**
   * 从存储恢复
   */
  function restoreFromStorage() {
    authStore.restoreFromStorage();
  }

  // ===== 返回 =====

  return {
    // 状态
    accessToken,
    refreshToken,
    currentSessionId,
    activeSessions,
    apiKeys,
    trustedDevices,
    isLoading,
    error,
    rememberedIdentifier,
    twoFactorSecret,
    twoFactorQrCode,
    twoFactorBackupCodes,

    // 计算属性
    isAuthenticated,
    isTokenExpired,
    isTokenExpiringSoon,
    sessionCount,
    apiKeyCount,
    trustedDeviceCount,

    // 认证核心
    login,
    register,
    logout,
    refreshAccessToken,
    checkAndRefreshToken,

    // 密码管理
    forgotPassword,
    resetPassword,
    changePassword,

    // 两步验证
    enable2FA,
    disable2FA,
    verify2FA,

    // 会话管理
    getActiveSessions,
    revokeSession,
    revokeAllSessions,

    // 设备管理
    getTrustedDevices,
    trustDevice,
    revokeTrustedDevice,

    // API Key 管理
    createApiKey,
    getApiKeys,
    revokeApiKey,

    // Store 操作
    clearAuth,
    clearAll,
    restoreFromStorage,
  };
}
