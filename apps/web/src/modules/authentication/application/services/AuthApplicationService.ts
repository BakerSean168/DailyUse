import { AuthenticationContracts, AccountContracts } from '@dailyuse/contracts';
import { AuthApiService } from '../../infrastructure/api/ApiClient';
import { AuthManager } from '../../../../shared/api/core/interceptors';
import { publishUserLoggedInEvent, publishUserLoggedOutEvent } from '../events/authEvents';
// ❌ 移除静态导入：import { AppInitializationManager } from '../../../../shared/initialization/AppInitializationManager';
import { useAuthenticationStore } from '../../presentation/stores/authenticationStore';

// Type aliases for cleaner code
type LoginRequestDTO = AuthenticationContracts.LoginRequestDTO;
type LoginResponseDTO = AuthenticationContracts.LoginResponseDTO;
type RefreshTokenRequestDTO = AuthenticationContracts.RefreshTokenRequestDTO;
type RefreshTokenResponseDTO = AuthenticationContracts.RefreshTokenResponseDTO;
type ChangePasswordRequestDTO = AuthenticationContracts.ChangePasswordRequestDTO;
type AuthSessionClientDTO = AuthenticationContracts.AuthSessionClientDTO;
type DeviceInfoClientDTO = AuthenticationContracts.DeviceInfoClientDTO;
type AccountClientDTO = AccountContracts.AccountClientDTO;

/**
 * Authentication Application Service
 * 认证应用服务 - 协调 API 调用和状态管理，实现认证相关用例
 */
export class AuthApplicationService {
  private static instance: AuthApplicationService | null = null;

  /**
   * 懒加载获取 authenticationStore
   * 避免在 Pinia 初始化之前调用
   */
  private get authStore() {
    return useAuthenticationStore();
  }

  private constructor() {}

  static async createInstance(): Promise<AuthApplicationService> {
    if (!AuthApplicationService.instance) {
      AuthApplicationService.instance = new AuthApplicationService();
    }
    return AuthApplicationService.instance;
  }

  static async getInstance(): Promise<AuthApplicationService> {
    if (!AuthApplicationService.instance) {
      AuthApplicationService.instance = new AuthApplicationService();
    }
    return AuthApplicationService.instance;
  }

  // ===== Login Use Cases =====

  /**
   * 用户登录
   * User Login
   */
  async login(request: LoginRequestDTO): Promise<LoginResponseDTO> {
    try {
      this.authStore.setLoading(true);
      this.authStore.setError(null);

      // 调用 API 登录 - 返回 LoginResponseDTO['data'] 格式
      const loginData = await AuthApiService.login(request);

      // 提取数据 - 新格式: { user, accessToken, refreshToken, sessionId, ... }
      const { user, accessToken, refreshToken, expiresIn, tokenType, sessionId, rememberToken } =
        loginData;

      // 使用 AuthManager 保存令牌（用于请求拦截器）
      AuthManager.setTokens(accessToken, refreshToken, rememberToken, expiresIn);

      // 同步到 store - 直接使用 AccountClientDTO
      this.authStore.setUser(user);
      this.authStore.setTokens({
        accessToken,
        refreshToken,
        rememberToken,
        expiresIn,
      });

      console.log('登录成功，你好', user.username);

      // 发布用户登录成功事件，让其他模块监听
      publishUserLoggedInEvent({
        accountUuid: user.uuid,
        username: user.username,
        sessionUuid: sessionId,
        accessToken,
        refreshToken,
        expiresIn,
        loginTime: new Date(),
      });

      // 初始化用户会话
      try {
        const { AppInitializationManager } = await import(
          '../../../../shared/initialization/AppInitializationManager'
        );
        await AppInitializationManager.initializeUserSession(user.uuid);
        console.log('🎯 [AuthService] 用户会话初始化完成');
      } catch (error) {
        console.warn('⚠️ [AuthService] 用户会话初始化失败，但不影响登录', error);
      }

      // 返回完整的 LoginResponseDTO 格式
      return loginData as unknown as LoginResponseDTO;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '登录失败';
      this.authStore.setError(errorMessage);
      throw error;
    } finally {
      this.authStore.setLoading(false);
    }
  }

  /**
   * 用户登出
   * User Logout
   */
  async logout(): Promise<void> {
    // 获取当前用户信息用于事件发布
    const currentUser = this.authStore.getCurrentUser;
    const accountUuid = currentUser?.uuid;
    const username = currentUser?.username;

    try {
      this.authStore.setLoading(true);

      // 调用后端登出 API
      await AuthApiService.logout();

      // 发布登出事件
      publishUserLoggedOutEvent({
        accountUuid,
        username,
        reason: 'manual',
        logoutTime: new Date(),
      });

      // 清理用户会话
      try {
        const { AppInitializationManager } = await import(
          '../../../../shared/initialization/AppInitializationManager'
        );
        await AppInitializationManager.cleanupUserSession();
        console.log('🧹 [AuthService] 用户会话清理完成');
      } catch (error) {
        console.warn('⚠️ [AuthService] 用户会话清理失败', error);
      }
    } catch (err: any) {
      console.warn('登出 API 调用失败:', err.message);
      // 即使 API 失败也继续清理本地状态
    } finally {
      // 清除所有令牌
      AuthManager.clearTokens();

      // 同步清除 authStore
      this.authStore.logout();
      this.authStore.setLoading(false);
    }
  }

  /**
   * 刷新访问令牌
   * Refresh Access Token
   */
  async refreshToken(): Promise<void> {
    const refreshToken = this.authStore.getRefreshToken;

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      this.authStore.setLoading(true);

      // 调用 API 刷新令牌 - extractData 已解包返回 RefreshTokenResponseDTO['data']
      const tokenData = await AuthApiService.refreshToken({ refreshToken });

      // 提取数据
      const { accessToken, refreshToken: newRefreshToken, expiresIn } = tokenData;

      // 使用 AuthManager 更新令牌
      AuthManager.setTokens(accessToken, newRefreshToken, undefined, expiresIn);

      // 同步到 store
      this.authStore.setAccessToken(accessToken);
      this.authStore.setRefreshToken(newRefreshToken);

      console.log('令牌刷新成功');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '刷新令牌失败';
      this.authStore.setError(errorMessage);
      console.error('Token refresh failed:', error);
      throw error;
    } finally {
      this.authStore.setLoading(false);
    }
  }

  /**
   * 获取当前用户信息
   * Get Current User
   */
  async getCurrentUser(): Promise<AccountClientDTO> {
    try {
      this.authStore.setLoading(true);

      const userInfo = await AuthApiService.getCurrentUser();

      // 同步到 store
      this.authStore.setUser(userInfo);

      return userInfo;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取用户信息失败';
      this.authStore.setError(errorMessage);
      throw error;
    } finally {
      this.authStore.setLoading(false);
    }
  }

  /**
   * 初始化认证状态
   * Initialize Authentication
   */
  async initAuth(): Promise<AccountClientDTO | null> {
    if (!AuthManager.isAuthenticated()) return null;

    // 检查 Token 是否过期
    if (AuthManager.isTokenExpired()) {
      try {
        await this.refreshToken();
      } catch (error) {
        // Token 刷新失败，清除认证状态
        await this.logout();
        throw error;
      }
    }

    try {
      return await this.getCurrentUser();
    } catch (err) {
      // 如果获取用户信息失败，清除认证状态
      await this.logout();
      throw err;
    }
  } /**
   * 修改密码
   * Change Password
   */
  async changePassword(data: ChangePasswordRequestDTO): Promise<void> {
    try {
      this.authStore.setLoading(true);

      await AuthApiService.changePassword(data);

      console.log('密码修改成功');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '修改密码失败';
      this.authStore.setError(errorMessage);
      throw error;
    } finally {
      this.authStore.setLoading(false);
    }
  }

  // ===== MFA Management =====

  /**
   * 获取 MFA 设备列表
   * Get MFA Devices
   */
  async getMFADevices(): Promise<DeviceInfoClientDTO[]> {
    try {
      this.authStore.setLoading(true);

      const devicesData = await AuthApiService.getMFADevices();

      // 同步到 store
      this.authStore.setMFADevices(devicesData.devices);

      return devicesData.devices;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取 MFA 设备失败';
      this.authStore.setError(errorMessage);
      throw error;
    } finally {
      this.authStore.setLoading(false);
    }
  }

  /**
   * 删除 MFA 设备
   * Delete MFA Device
   */
  async deleteMFADevice(deviceId: string): Promise<void> {
    try {
      this.authStore.setLoading(true);

      await AuthApiService.deleteMFADevice(deviceId);

      // 从 store 移除
      this.authStore.removeMFADevice(deviceId);

      console.log('MFA 设备删除成功');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除 MFA 设备失败';
      this.authStore.setError(errorMessage);
      throw error;
    } finally {
      this.authStore.setLoading(false);
    }
  }

  // ===== Session Management =====

  /**
   * 获取用户会话列表
   * Get User Sessions
   */
  async getSessions(): Promise<AuthSessionClientDTO[]> {
    try {
      this.authStore.setLoading(true);

      const sessionsData = await AuthApiService.getSessions();

      // 找到当前会话
      const currentSession = sessionsData.sessions.find((s: any) => s.isCurrent);
      if (currentSession) {
        this.authStore.setCurrentSession(currentSession);
      }

      return sessionsData.sessions;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取会话列表失败';
      this.authStore.setError(errorMessage);
      throw error;
    } finally {
      this.authStore.setLoading(false);
    }
  }

  /**
   * 终止指定会话
   * Terminate Session
   */
  async terminateSession(sessionId: string): Promise<void> {
    try {
      this.authStore.setLoading(true);

      await AuthApiService.terminateSession(sessionId);

      console.log('会话终止成功');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '终止会话失败';
      this.authStore.setError(errorMessage);
      throw error;
    } finally {
      this.authStore.setLoading(false);
    }
  }

  // ===== Permission & Role Checks =====

  /**
   * 检查权限
   * Check Permission
   */
  hasPermission(permission: string): boolean {
    return this.authStore.hasPermission(permission);
  }

  /**
   * 检查角色
   * Check Role
   */
  hasRole(role: string): boolean {
    return this.authStore.hasRole(role);
  }
}
