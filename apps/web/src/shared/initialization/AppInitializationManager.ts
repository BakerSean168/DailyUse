/**
 * 应用模块初始化管理器
 * App Module Initialization Manager
 *
 * 基于 packages/utils 中的 WebInitializationManager 实现
 * 支持动态模块加载和分阶段初始化
 */

import {
  InitializationManager,
  InitializationPhase,
  WebInitializationManager,
  ModuleGroup,
  type InitializationTask,
  type LoadingProgress,
} from '@dailyuse/utils';
import { initializeModuleRegistry } from './moduleRegistry';

/**
 * 注册基础设施的初始化任务
 */
function registerInfrastructureInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // 事件系统初始化任务
  const eventSystemInitTask: InitializationTask = {
    name: 'event-system',
    phase: InitializationPhase.APP_STARTUP,
    priority: 5, // 最高优先级，最先初始化
    initialize: async () => {
      // 事件系统已经在 packages/utils 中自动初始化了
      console.log('✅ [Infrastructure] 事件系统已就绪');
    },
    cleanup: async () => {
      console.log('🧹 [Infrastructure] 事件系统已清理');
    },
  };

  // API 客户端初始化任务
  const apiClientInitTask: InitializationTask = {
    name: 'api-client',
    phase: InitializationPhase.APP_STARTUP,
    priority: 10,
    initialize: async () => {
      // API 客户端配置初始化
      console.log('✅ [Infrastructure] API 客户端已初始化');
    },
    cleanup: async () => {
      console.log('🧹 [Infrastructure] API 客户端已清理');
    },
  };

  // Token 刷新处理器初始化任务
  const tokenRefreshHandlerInitTask: InitializationTask = {
    name: 'token-refresh-handler',
    phase: InitializationPhase.APP_STARTUP,
    priority: 15,
    initialize: async () => {
      // 动态导入 Token 刷新处理器，避免打包时加载
      const { initializeTokenRefreshHandler } = await import(
        '@/modules/authentication/infrastructure/tokenRefreshHandler'
      );
      initializeTokenRefreshHandler();
      console.log('✅ [Infrastructure] Token 刷新处理器已初始化');
    },
    cleanup: async () => {
      console.log('🧹 [Infrastructure] Token 刷新处理器已清理');
    },
  };

  manager.registerTask(eventSystemInitTask);
  manager.registerTask(apiClientInitTask);
  manager.registerTask(tokenRefreshHandlerInitTask);

  console.log('📝 [Infrastructure] 基础设施初始化任务已注册');
}

/**
 * 应用初始化管理器
 */
export class AppInitializationManager {
  private static initialized = false;
  private static authenticatedModulesLoaded = false;
  private static webManager: WebInitializationManager;

  /**
   * 初始化应用（只加载关键模块）
   */
  static async initializeApp(): Promise<void> {
    if (AppInitializationManager.initialized) {
      console.log('⚠️ [AppInitializationManager] 应用已经初始化，跳过重复初始化');
      return;
    }

    console.log('🚀 [AppInitializationManager] 开始初始化应用（仅关键模块）');

    try {
      // 1. 初始化模块注册表
      initializeModuleRegistry();
      AppInitializationManager.webManager = WebInitializationManager.getInstance();

      // 2. 注册基础设施
      registerInfrastructureInitializationTasks();

      // 3. 动态加载关键模块（theme、authentication）
      console.log('📦 [AppInitializationManager] 加载关键模块...');
      await AppInitializationManager.webManager.loadModuleGroup(
        ModuleGroup.CRITICAL,
        (progress: LoadingProgress) => {
          console.log(
            `[${progress.current}/${progress.total}] ${progress.status}: ${progress.moduleName} (${progress.percentage}%)`,
          );
        },
      );

      // 4. 执行应用启动阶段的初始化
      const manager = InitializationManager.getInstance();
      await manager.executePhase(InitializationPhase.APP_STARTUP);

      AppInitializationManager.initialized = true;
      console.log('✅ [AppInitializationManager] 应用初始化完成（关键模块已加载）');
    } catch (error) {
      console.error('❌ [AppInitializationManager] 应用初始化失败', error);
      AppInitializationManager.initialized = true; // 容错模式
      console.warn('⚠️ [AppInitializationManager] 以降级模式完成初始化');
    }
  }

  /**
   * 用户登录时的初始化（加载业务模块）
   */
  static async initializeUserSession(accountUuid: string): Promise<void> {
    console.log(`🔐 [AppInitializationManager] 初始化用户会话: ${accountUuid}`);

    try {
      // 1. 如果业务模块还没加载，先动态加载
      if (!AppInitializationManager.authenticatedModulesLoaded) {
        console.log('📦 [AppInitializationManager] 加载业务模块...');

        await AppInitializationManager.webManager.loadModuleGroup(
          ModuleGroup.AUTHENTICATED,
          (progress: LoadingProgress) => {
            console.log(
              `[${progress.current}/${progress.total}] ${progress.status}: ${progress.moduleName} (${progress.percentage}%)`,
            );
          },
        );

        AppInitializationManager.authenticatedModulesLoaded = true;
        console.log('✅ [AppInitializationManager] 业务模块已加载');
      }

      // 2. 执行用户登录阶段的初始化
      const manager = InitializationManager.getInstance();
      await manager.executePhase(InitializationPhase.USER_LOGIN, { accountUuid });

      console.log(`✅ [AppInitializationManager] 用户会话初始化完成: ${accountUuid}`);
    } catch (error) {
      console.error('❌ [AppInitializationManager] 用户会话初始化失败', error);
      throw error;
    }
  }

  /**
   * 用户登出时的清理
   */
  static async cleanupUserSession(): Promise<void> {
    console.log('🔒 [AppInitializationManager] 清理用户会话');

    try {
      const manager = InitializationManager.getInstance();
      await manager.cleanupPhase(InitializationPhase.USER_LOGIN);

      console.log('✅ [AppInitializationManager] 用户会话清理完成');
    } catch (error) {
      console.error('❌ [AppInitializationManager] 用户会话清理失败', error);
    }
  }

  /**
   * 预加载业务模块（可选优化）
   * 在空闲时间提前加载，提升登录后的体验
   */
  static async preloadAuthenticatedModules(): Promise<void> {
    if (AppInitializationManager.authenticatedModulesLoaded) {
      return;
    }

    console.log('🔮 [AppInitializationManager] 开始预加载业务模块...');

    try {
      await AppInitializationManager.webManager.preloadModuleGroup(ModuleGroup.AUTHENTICATED, {
        useIdleCallback: true,
        onProgress: (progress: LoadingProgress) => {
          console.log(
            `[预加载] [${progress.current}/${progress.total}] ${progress.status}: ${progress.moduleName}`,
          );
        },
      });

      AppInitializationManager.authenticatedModulesLoaded = true;
      console.log('✅ [AppInitializationManager] 业务模块预加载完成');
    } catch (error) {
      console.warn('⚠️ [AppInitializationManager] 业务模块预加载失败（不影响功能）', error);
    }
  }

  /**
   * 销毁应用
   * 应该在应用关闭时调用
   */
  static async destroyApp(): Promise<void> {
    if (!AppInitializationManager.initialized) {
      return;
    }

    console.log('💥 [AppInitializationManager] 开始销毁应用');

    try {
      const manager = InitializationManager.getInstance();

      // 清理所有阶段
      await manager.cleanupPhase(InitializationPhase.USER_LOGIN);
      await manager.cleanupPhase(InitializationPhase.APP_STARTUP);

      AppInitializationManager.initialized = false;
      console.log('✅ [AppInitializationManager] 应用销毁完成');
    } catch (error) {
      console.error('❌ [AppInitializationManager] 应用销毁失败', error);
    }
  }

  /**
   * 检查应用是否已初始化
   */
  static isInitialized(): boolean {
    return AppInitializationManager.initialized;
  }

  /**
   * 检查特定任务是否已完成
   */
  static isTaskCompleted(taskName: string): boolean {
    const manager = InitializationManager.getInstance();
    return manager.isTaskCompleted(taskName);
  }

  /**
   * 获取初始化管理器实例
   */
  static getManager(): InitializationManager {
    return InitializationManager.getInstance();
  }

  /**
   * 获取所有已注册的任务
   */
  static listAllTasks(): InitializationTask[] {
    const manager = InitializationManager.getInstance();
    return manager.listTasks();
  }

  /**
   * 重新初始化应用
   * 先销毁再初始化
   */
  static async reinitializeApp(): Promise<void> {
    console.log('🔄 [AppInitializationManager] 重新初始化应用');

    await AppInitializationManager.destroyApp();
    await AppInitializationManager.initializeApp();
  }

  /**
   * 重置初始化管理器（用于测试）
   */
  static resetForTesting(): void {
    const manager = InitializationManager.getInstance();
    manager.reset(true); // 清除所有任务
    AppInitializationManager.initialized = false;
    console.log('🧪 [AppInitializationManager] 已重置用于测试');
  }
}
