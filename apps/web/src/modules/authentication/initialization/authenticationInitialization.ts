/**
 * 认证模块初始化任务注册
 * Authentication Module Initialization Tasks
 */

import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';
import { useAuthStore } from '../presentation/stores/authenticationStore';
import { useAccountStore } from '@/modules/account';
import { AuthManager } from '../../../shared/api/core/interceptors';
import { Account } from '@dailyuse/domain-client';
/**
 * 注册认证模块的所有初始化任务
 */
export function registerAuthenticationInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // 1. 认证状态恢复任务
  const authStateRestoreTask: InitializationTask = {
    name: 'auth-state-restore',
    phase: InitializationPhase.APP_STARTUP,
    priority: 15,
    initialize: async () => {
      console.log('🔐 [AuthModule] 恢复认证状态');
      const accountStore = useAccountStore();

      // 直接从 AuthManager 读取 token 信息
      const accessToken = AuthManager.getAccessToken();
      const refreshToken = AuthManager.getRefreshToken();
      const isTokenExpired = AuthManager.isTokenExpired();

      if (!accessToken || !refreshToken) {
        console.log('ℹ️ [AuthModule] 未发现有效的 token，清除旧数据');
        // 清除可能残留的认证数据
        localStorage.removeItem('authentication');
        localStorage.removeItem('auth');
        accountStore.currentAccount = null;
        // 确保 loading 状态为 false
        const authStore = useAuthStore();
        authStore.setLoading(false);
        return;
      }

      if (isTokenExpired) {
        console.log('⚠️ [AuthModule] Token已过期，清除认证状态');
        AuthManager.clearTokens();
        // 清除 Pinia 持久化的数据
        localStorage.removeItem('authentication');
        localStorage.removeItem('auth'); // 兼容旧版本
        // 清除账户信息
        accountStore.currentAccount = null;
        // 确保 loading 状态为 false
        const authStore = useAuthStore();
        authStore.setLoading(false);
        return;
      }

      console.log('✅ [AuthModule] 发现有效的 token，恢复账户信息');

      // 从 localStorage 读取持久化的账户数据
      const persistedData = localStorage.getItem('authentication');
      if (persistedData) {
        try {
          const authData = JSON.parse(persistedData);
          if (authData.user) {
            // 恢复账户信息到 accountStore
            const accountEntity = Account.fromClientDTO(authData.user);
            accountStore.currentAccount = accountEntity.toClientDTO() as any;
            console.log('✅ [AuthModule] 账户信息已恢复:', accountEntity.username);

            // 触发自动登录流程
            console.log(`🚀 [AuthModule] 触发自动登录: ${accountEntity.uuid}`);
            const { AppInitializationManager } = await import(
              '../../../shared/initialization/AppInitializationManager'
            );
            await AppInitializationManager.initializeUserSession(accountEntity.uuid);
            console.log('✅ [AuthModule] 自动登录完成');
          }
        } catch (error) {
          console.error('❌ [AuthModule] 解析持久化数据失败:', error);
          localStorage.removeItem('authentication');
          // 确保 loading 状态为 false
          const authStore = useAuthStore();
          authStore.setLoading(false);
        }
      } else {
        console.log('ℹ️ [AuthModule] 未发现持久化的账户信息');
        // 确保 loading 状态为 false
        const authStore = useAuthStore();
        authStore.setLoading(false);
      }
    },
    cleanup: async () => {
      console.log('🧹 [AuthModule] 清理认证状态');
      // 清理认证相关的状态
      AuthManager.clearTokens();
    },
  };

  // 2. 认证配置初始化任务
  const authConfigInitTask: InitializationTask = {
    name: 'auth-config-init',
    phase: InitializationPhase.APP_STARTUP,
    priority: 10,
    initialize: async () => {
      console.log('⚙️ [AuthModule] 初始化认证配置');
      // 初始化认证相关的配置
      // 例如：API 端点、超时设置、重试策略等
    },
  };

  // 3. 用户会话启动任务
  const userSessionStartTask: InitializationTask = {
    name: 'user-session-start',
    phase: InitializationPhase.USER_LOGIN,
    priority: 5, // 最高优先级，用户登录时首先执行
    initialize: async (context?: { accountUuid: string }) => {
      if (context?.accountUuid) {
        console.log(`👤 [AuthModule] 启动用户会话: ${context.accountUuid}`);
        // 启动用户会话相关的服务
        // 例如：心跳检测、会话保活等
      }
    },
    cleanup: async () => {
      console.log('🔚 [AuthModule] 结束用户会话');
      // 清理用户会话
    },
  };

  // 4. Token 刷新服务任务
  const tokenRefreshServiceTask: InitializationTask = {
    name: 'token-refresh-service',
    phase: InitializationPhase.USER_LOGIN,
    priority: 10,
    dependencies: ['user-session-start'], // 依赖会话启动
    initialize: async () => {
      console.log('🔄 [AuthModule] 启动 Token 刷新服务');
      // 启动 Token 自动刷新服务
    },
    cleanup: async () => {
      console.log('🛑 [AuthModule] 停止 Token 刷新服务');
      // 停止 Token 刷新服务
    },
  };

  // 注册所有任务
  manager.registerTask(authConfigInitTask);
  manager.registerTask(authStateRestoreTask);
  manager.registerTask(userSessionStartTask);
  manager.registerTask(tokenRefreshServiceTask);

  console.log('📝 [AuthModule] 所有初始化任务已注册');
}
