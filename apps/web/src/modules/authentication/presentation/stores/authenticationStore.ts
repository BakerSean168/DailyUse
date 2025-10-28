import { defineStore } from 'pinia';
import type { AuthenticationContracts, AccountContracts } from '@dailyuse/contracts';
import { AuthManager } from '@/shared/api';
import { AuthCredential, AuthSession } from '@dailyuse/domain-client';

// 类型别名
type AuthCredentialClientDTO = AuthenticationContracts.AuthCredentialClientDTO;
type AuthSessionClientDTO = AuthenticationContracts.AuthSessionClientDTO;
type AccountClientDTO = AccountContracts.AccountClientDTO;

// MFA 设备临时类型（需要在 contracts 中定义）
interface MFADeviceClientDTO {
  uuid: string;
  name: string;
  type: string;
  isEnabled: boolean;
  createdAt: number;
  lastUsedAt?: number;
}

export interface AuthenticationState {
  // 用户账户信息
  account: AccountClientDTO | null;

  // 当前会话（使用聚合根）
  currentSession: AuthSession | null;

  // 认证凭证（使用聚合根）
  credential: AuthCredential | null;

  // MFA 设备
  mfaDevices: MFADeviceClientDTO[];

  // UI 状态
  isLoading: boolean;
  error: string | null;
}

export const useAuthenticationStore = defineStore('authentication', {
  state: (): AuthenticationState => ({
    account: null,
    currentSession: null,
    credential: null,
    mfaDevices: [],
    isLoading: false,
    error: null,
  }),

  getters: {
    /**
     * 是否已认证 - 委托给 AuthManager
     */
    isAuthenticated: () => AuthManager.isAuthenticated(),

    /**
     * 获取访问令牌 - 委托给 AuthManager
     */
    getAccessToken: () => AuthManager.getAccessToken(),

    /**
     * 获取刷新令牌 - 委托给 AuthManager
     */
    getRefreshToken: () => AuthManager.getRefreshToken(),

    /**
     * 获取当前账户
     */
    getCurrentUser: (state) => state.account,

    /**
     * 获取用户 UUID
     */
    getUserUuid: (state) => state.account?.uuid,

    /**
     * 获取用户名
     */
    getUsername: (state) => state.account?.username,

    /**
     * 获取当前会话
     */
    getCurrentSession: (state) => state.currentSession,

    /**
     * 会话是否活跃
     */
    isSessionActive: (state) => state.currentSession?.isActive() ?? false,

    /**
     * 会话剩余时间（秒）
     */
    sessionSecondsRemaining: (state) => state.currentSession?.getRemainingTime() ?? 0,

    /**
     * Token 是否即将过期（10分钟内）
     */
    isTokenExpiringSoon: () => {
      const expiry = AuthManager.getTokenExpiry();
      if (!expiry) return false;
      return Date.now() > expiry - 10 * 60 * 1000;
    },

    /**
     * Token 是否已过期 - 委托给 AuthManager
     */
    isTokenExpired: () => AuthManager.isTokenExpired(),

    /**
     * Token 是否需要刷新 - 委托给 AuthManager
     */
    needsRefresh: () => AuthManager.needsRefresh(),

    /**
     * 获取 Token 过期时间
     */
    tokenExpiry: () => AuthManager.getTokenExpiry(),

    /**
     * 获取用户角色
     * TODO: 需要从授权服务获取
     */
    getUserRoles: (state) => [] as string[], // state.account?.roles ?? [],

    /**
     * 获取用户权限
     * TODO: 需要从授权服务获取
     */
    getUserPermissions: (state) => [] as string[], // state.account?.permissions ?? [],

    /**
     * 检查是否有指定角色
     * TODO: 需要从授权服务获取
     */
    hasRole: (state) => (role: string) => {
      return false; // state.account?.roles?.includes(role) ?? false;
    },

    /**
     * 检查是否有指定权限
     * TODO: 需要从授权服务获取
     */
    hasPermission: (state) => (permission: string) => {
      return false; // state.account?.permissions?.includes(permission) ?? false;
    },

    /**
     * 获取 MFA 设备列表
     */
    getMFADevices: (state) => state.mfaDevices,

    /**
     * 是否启用 MFA
     */
    hasMFAEnabled: (state) => state.mfaDevices.some((device) => device.isEnabled),

    /**
     * 是否正在加载
     */
    getLoading: (state) => state.isLoading,

    /**
     * 是否正在加载 (兼容 useAuthStore API)
     */
    loading: (state) => state.isLoading,

    /**
     * 获取错误信息
     */
    getError: (state) => state.error,

    /**
     * 访问 token - 兼容旧代码
     */
    accessToken: () => AuthManager.getAccessToken(),

    /**
     * 刷新 token - 兼容旧代码
     */
    refreshToken: () => AuthManager.getRefreshToken(),
  },

  actions: {
    /**
     * 设置认证数据（从 LoginResponse 设置）
     */
    setAuthData(loginResponse: {
      user: AccountClientDTO;
      accessToken: string;
      refreshToken: string;
      expiresIn: number; // 秒
      tokenType?: string;
      sessionId?: string;
    }) {
      this.account = loginResponse.user;

      // 将 token 存储到 AuthManager
      AuthManager.setTokens(
        loginResponse.accessToken,
        loginResponse.refreshToken,
        undefined,
        loginResponse.expiresIn,
      );
    },

    /**
     * 设置用户信息
     */
    setUser(account: AccountClientDTO) {
      this.account = account;
    },

    /**
     * 设置访问令牌 - 委托给 AuthManager
     */
    setAccessToken(token: string, expiresIn?: number) {
      AuthManager.updateAccessToken(token, expiresIn);
    },

    /**
     * 设置刷新令牌 - 委托给 AuthManager
     * @deprecated 直接使用 AuthManager.setTokens()
     */
    setRefreshToken(token: string) {
      // 保留为空方法以兼容旧代码
      console.warn('setRefreshToken is deprecated, use AuthManager.setTokens() instead');
    },

    /**
     * 设置当前会话（从 DTO 创建聚合根）
     */
    setCurrentSession(sessionDTO: AuthSessionClientDTO) {
      this.currentSession = AuthSession.fromClientDTO(sessionDTO);
    },

    /**
     * 设置当前会话聚合根（直接设置）
     */
    setCurrentSessionAggregate(session: AuthSession | null) {
      this.currentSession = session;
    },

    /**
     * 设置认证凭证（从 DTO 创建聚合根）
     */
    setCredential(credentialDTO: AuthCredentialClientDTO) {
      this.credential = AuthCredential.fromClientDTO(credentialDTO);
    },

    /**
     * 设置认证凭证聚合根（直接设置）
     */
    setCredentialAggregate(credential: AuthCredential | null) {
      this.credential = credential;
    },

    /**
     * 设置 MFA 设备列表
     */
    setMFADevices(devices: MFADeviceClientDTO[]) {
      this.mfaDevices = devices;
    },

    /**
     * 添加 MFA 设备
     */
    addMFADevice(device: MFADeviceClientDTO) {
      this.mfaDevices.push(device);
    },

    /**
     * 移除 MFA 设备
     */
    removeMFADevice(deviceUuid: string) {
      this.mfaDevices = this.mfaDevices.filter((d) => d.uuid !== deviceUuid);
    },

    /**
     * 设置加载状态
     */
    setLoading(loading: boolean) {
      this.isLoading = loading;
    },

    /**
     * 设置错误信息
     */
    setError(error: string | null) {
      this.error = error;
    },

    /**
     * 清除错误信息
     */
    clearError() {
      this.error = null;
    },

    /**
     * 设置 Tokens (兼容 useAuthStore API) - 委托给 AuthManager
     */
    setTokens(tokens: {
      accessToken: string;
      refreshToken: string;
      rememberToken?: string;
      expiresIn?: number;
    }) {
      AuthManager.setTokens(
        tokens.accessToken,
        tokens.refreshToken,
        tokens.rememberToken,
        tokens.expiresIn,
      );
    },

    /**
     * 清除认证数据 (兼容 useAuthStore API)
     */
    clearAuth() {
      this.logout();
    },

    /**
     * 清除认证数据（登出）
     */
    logout() {
      this.account = null;
      this.currentSession = null;
      this.credential = null;
      this.mfaDevices = [];
      this.isLoading = false;
      this.error = null;

      // 清除 AuthManager 中的 tokens
      AuthManager.clearTokens();
    },
  },

  // 配置 Pinia 持久化（只持久化用户信息和会话，不持久化 tokens）
  persist: true,
});

// ===== 别名导出，向后兼容 =====
export const useAuthStore = useAuthenticationStore;

// ===== 类型导出 =====
export type AuthStore = ReturnType<typeof useAuthenticationStore>;
