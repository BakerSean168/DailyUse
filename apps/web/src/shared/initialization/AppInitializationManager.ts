/**
 * 应用模块初始化管理器
 * App Module Initialization Manager
 *
 * 基于 packages/utils 中的 InitializationManager 实现
 */

import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';
import { registerAccountInitializationTasks } from '../../modules/account';
import { registerAuthenticationInitializationTasks } from '../../modules/authentication';
import { registerGoalInitializationTasks } from '../../modules/goal';
import { registerTaskInitializationTasks } from '../../modules/task';
import { registerReminderInitializationTasks } from '../../modules/reminder';
import { registerNotificationInitializationTasks } from '../../modules/notification';
import { registerSSEInitializationTasks } from '../../modules/notification/initialization/sseInitialization';
import { registerScheduleInitializationTasks } from '../../modules/schedule';
import { registerDataInitializationTasks } from './dataInitialization';

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

  manager.registerTask(eventSystemInitTask);
  manager.registerTask(apiClientInitTask);

  console.log('📝 [Infrastructure] 基础设施初始化任务已注册');
}

/**
 * 注册所有模块的初始化任务
 */
function registerAllInitializationTasks(): void {
  console.log('📋 [AppInitialization] 开始注册所有初始化任务');

  // 1. 注册基础设施初始化任务
  registerInfrastructureInitializationTasks();

  // 2. 注册各个模块的初始化任务
  registerAuthenticationInitializationTasks();
  registerAccountInitializationTasks();
  registerNotificationInitializationTasks(); // 在用户模块之前初始化通知系统
  registerSSEInitializationTasks(); // 初始化 SSE 连接
  registerScheduleInitializationTasks(); // 初始化调度模块
  registerDataInitializationTasks(); // 初始化数据加载
  // Theme module has been removed - theme management is now integrated into Setting module
  registerGoalInitializationTasks();
  registerTaskInitializationTasks();
  registerReminderInitializationTasks();

  // 3. 可以在这里添加其他模块的初始化
  // registerOtherModuleInitializationTasks();

  console.log('✅ [AppInitialization] 所有初始化任务注册完成');
}

/**
 * 应用初始化管理器
 */
export class AppInitializationManager {
  private static initialized = false;

  /**
   * 初始化应用
   * 应该在应用启动时调用
   */
  static async initializeApp(): Promise<void> {
    if (AppInitializationManager.initialized) {
      console.log('⚠️ [AppInitializationManager] 应用已经初始化，跳过重复初始化');
      return;
    }

    console.log('🚀 [AppInitializationManager] 开始初始化应用');

    try {
      // 1. 注册所有初始化任务
      registerAllInitializationTasks();

      // 2. 执行应用启动阶段的初始化（使用容错模式）
      const manager = InitializationManager.getInstance();

      try {
        await manager.executePhase(InitializationPhase.APP_STARTUP);
        console.log('✅ [AppInitializationManager] 所有模块初始化完成');
      } catch (error) {
        console.warn('⚠️ [AppInitializationManager] 部分模块初始化失败，但应用将继续启动:', error);
        // 不抛出错误，允许应用在部分模块失败的情况下继续运行
      }

      AppInitializationManager.initialized = true;
      console.log('✅ [AppInitializationManager] 应用初始化完成');
    } catch (error) {
      console.error('❌ [AppInitializationManager] 应用核心初始化失败', error);

      // 即使核心初始化失败，也设置为已初始化，避免阻塞应用
      AppInitializationManager.initialized = true;
      console.warn('⚠️ [AppInitializationManager] 以降级模式完成初始化');
    }
  }

  /**
   * 用户登录时的初始化
   */
  static async initializeUserSession(accountUuid: string): Promise<void> {
    console.log(`🔐 [AppInitializationManager] 初始化用户会话: ${accountUuid}`);

    try {
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
