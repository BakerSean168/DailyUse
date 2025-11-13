/**
 * Web 应用模块注册表
 * Web Application Module Registry
 *
 * 定义所有模块的加载配置，支持动态导入和按需加载
 */

import { 
  WebInitializationManager, 
  ModuleGroup, 
  type ModuleDefinition 
} from '@dailyuse/utils';

/**
 * 初始化模块注册表
 * 在应用启动时调用一次
 */
export function initializeModuleRegistry(): void {
  const webManager = WebInitializationManager.getInstance();

  // ========== 关键模块（登录前必须加载） ==========
  webManager.registerModules(ModuleGroup.CRITICAL, [
    {
      name: 'theme',
      loader: () => import('@/modules/theme/initialization').then(m => ({
        register: m.registerThemeInitializationTasks,
      })),
      priority: 100, // 最高优先级
      required: true,
    },
    {
      name: 'authentication',
      loader: () => import('@/modules/authentication').then(m => ({
        register: m.registerAuthenticationInitializationTasks,
      })),
      priority: 90,
      required: true,
    },
  ]);

  // ========== 认证后模块（登录成功后加载） ==========
  webManager.registerModules(ModuleGroup.AUTHENTICATED, [
    // 账户模块（高优先级）
    {
      name: 'account',
      loader: () => import('@/modules/account').then(m => ({
        register: m.registerAccountInitializationTasks,
      })),
      priority: 80,
      required: true,
    },

    // 通知模块（高优先级）
    {
      name: 'notification',
      loader: () => import('@/modules/notification').then(m => ({
        register: m.registerNotificationInitializationTasks,
      })),
      priority: 70,
      required: false, // 非必需，失败不影响应用启动
    },

    // SSE 连接（依赖通知模块）
    {
      name: 'sse',
      loader: () => import('@/modules/notification/initialization/sseInitialization').then(m => ({
        register: m.registerSSEInitializationTasks,
      })),
      priority: 65,
      required: false,
    },

    // 设置模块
    {
      name: 'setting',
      loader: () => import('@/modules/setting/initialization/settingInitialization').then(m => ({
        register: m.registerSettingInitializationTasks,
      })),
      priority: 60,
      required: false,
    },

    // 调度模块
    {
      name: 'schedule',
      loader: () => import('@/modules/schedule').then(m => ({
        register: m.registerScheduleInitializationTasks,
      })),
      priority: 55,
      required: false,
    },

    // 数据初始化（依赖其他模块）
    {
      name: 'data',
      loader: () => import('./dataInitialization').then(m => ({
        register: m.registerDataInitializationTasks,
      })),
      priority: 50,
      required: false,
    },

    // 业务模块（可并行加载）
    {
      name: 'goal',
      loader: () => import('@/modules/goal').then(m => ({
        register: m.registerGoalInitializationTasks,
      })),
      priority: 40,
      required: false,
      maxRetries: 2, // 减少重试次数（非关键模块）
    },
    {
      name: 'task',
      loader: () => import('@/modules/task').then(m => ({
        register: m.registerTaskInitializationTasks,
      })),
      priority: 40,
      required: false,
      maxRetries: 2,
    },
    {
      name: 'reminder',
      loader: () => import('@/modules/reminder').then(m => ({
        register: m.registerReminderInitializationTasks,
      })),
      priority: 40,
      required: false,
      maxRetries: 2,
    },
  ]);

  console.log('📝 [ModuleRegistry] 模块注册表初始化完成');
}

/**
 * 获取 Web 初始化管理器实例
 */
export function getWebInitializationManager(): WebInitializationManager {
  return WebInitializationManager.getInstance();
}
