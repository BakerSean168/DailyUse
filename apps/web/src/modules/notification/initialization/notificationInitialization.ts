/**
 * Notification 模块初始化任务注册
 * @description 为 notification 模块注册初始化任务到应用级别的初始化管理器中
 * 
 * 架构说明：
 * - APP_STARTUP 阶段：初始化不依赖用户登录态的核心通知服务（NotificationService、事件总线等）
 * - USER_LOGIN 阶段：初始化需要用户登录态的功能（提醒通知处理器等）
 * - SSE 连接在 sseInitialization.ts 的 USER_LOGIN 阶段单独处理
 */

import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';
import { NotificationInitializationManager } from '../application/initialization/NotificationInitializationManager';
import { reminderNotificationHandler } from '../application/handlers/ReminderNotificationHandler';

/**
 * 注册 Notification 模块的初始化任务
 */
export function registerNotificationInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // ========== APP_STARTUP 阶段：核心通知服务（不依赖登录态） ==========
  const notificationInitTask: InitializationTask = {
    name: 'notification-core',
    phase: InitializationPhase.APP_STARTUP,
    priority: 15, // 在基础设施初始化后，在用户模块之前
    initialize: async () => {
      console.log('🔔 [Notification] 开始初始化通知核心服务（APP_STARTUP）...');

      try {
        const notificationManager = NotificationInitializationManager.getInstance();
        await notificationManager.initializeNotificationModule();

        console.log('✅ [Notification] 通知核心服务初始化完成（不依赖用户登录态）');
      } catch (error) {
        console.error('❌ [Notification] 通知核心服务初始化失败:', error);
        throw error;
      }
    },
    cleanup: async () => {
      console.log('🧹 [Notification] 清理通知核心服务...');

      try {
        const notificationManager = NotificationInitializationManager.getInstance();
        notificationManager.destroy();

        console.log('✅ [Notification] 通知核心服务清理完成');
      } catch (error) {
        console.error('❌ [Notification] 通知核心服务清理失败:', error);
      }
    },
  };

  // ========== USER_LOGIN 阶段：提醒通知处理器（依赖登录态） ==========
  const reminderNotificationTask: InitializationTask = {
    name: 'reminder-notification-handler',
    phase: InitializationPhase.USER_LOGIN,
    priority: 20, // 在 SSE 连接建立后
    initialize: async (context) => {
      console.log(`📬 [Notification] 初始化提醒通知处理器（USER_LOGIN）: ${context?.accountUuid}`);

      try {
        // 初始化提醒通知处理器（会订阅 reminder-triggered 事件）
        reminderNotificationHandler.initialize();

        console.log('✅ [Notification] 提醒通知处理器初始化完成');
      } catch (error) {
        console.error('❌ [Notification] 提醒通知处理器初始化失败:', error);
        // 不阻塞用户登录流程
      }
    },
    cleanup: async (context) => {
      console.log(`🔇 [Notification] 清理提醒通知处理器: ${context?.accountUuid}`);

      try {
        reminderNotificationHandler.destroy();

        console.log('✅ [Notification] 提醒通知处理器清理完成');
      } catch (error) {
        console.error('❌ [Notification] 提醒通知处理器清理失败:', error);
      }
    },
  };

  // ========== USER_LOGIN 阶段：通知权限检查 ==========
  const notificationPermissionTask: InitializationTask = {
    name: 'notification-permissions',
    phase: InitializationPhase.USER_LOGIN,
    priority: 10,
    initialize: async (context) => {
      console.log(`🔐 [Notification] 检查用户通知权限: ${context?.accountUuid}`);

      try {
        const notificationManager = NotificationInitializationManager.getInstance();

        if (!notificationManager.isModuleInitialized()) {
          console.warn('[Notification] 通知模块未初始化，跳过权限检查');
          return;
        }

        const service = notificationManager.getNotificationService();
        if (!service) {
          console.warn('[Notification] 通知服务不可用');
          return;
        }

        const currentPermission = service.getPermission();
        console.log(`[Notification] 当前通知权限状态: ${currentPermission}`);

        // 如果用户之前没有授权，可以在这里再次提示
        if (currentPermission === 'default') {
          console.log('[Notification] 通知权限为默认状态，可考虑提示用户授权');
        }

        console.log('✅ [Notification] 用户通知权限检查完成');
      } catch (error) {
        console.error('❌ [Notification] 用户通知权限检查失败:', error);
        // 权限检查失败不应该阻止用户登录
      }
    },
    cleanup: async (context) => {
      console.log(`🔒 [Notification] 清理用户通知会话: ${context?.accountUuid}`);

      try {
        const notificationManager = NotificationInitializationManager.getInstance();
        const service = notificationManager.getNotificationService();

        if (service) {
          // 清理当前用户的所有通知
          await service.dismissAll();
          console.log('✅ [Notification] 用户通知会话清理完成');
        }
      } catch (error) {
        console.error('❌ [Notification] 用户通知会话清理失败:', error);
      }
    },
  };

  // 通知功能测试任务（开发环境）
  const notificationTestTask: InitializationTask = {
    name: 'notification-test',
    phase: InitializationPhase.USER_LOGIN,
    priority: 90, // 较低优先级，在其他任务之后执行
    initialize: async (context) => {
      // 只在开发环境执行测试
      if (import.meta.env.PROD) {
        return;
      }

      console.log(`🧪 [Notification] 执行通知功能测试: ${context?.accountUuid}`);

      try {
        const notificationManager = NotificationInitializationManager.getInstance();

        if (!notificationManager.isModuleInitialized()) {
          console.warn('[Notification] 通知模块未初始化，跳过功能测试');
          return;
        }

        const testResults = await notificationManager.testNotificationFeatures();
        console.log('[Notification] 通知功能测试结果:', testResults);

        // 在开发环境显示测试通知
        if (testResults.permissionGranted && testResults.desktopSupport) {
          const service = notificationManager.getNotificationService();
          if (service) {
            await service.showSuccess('通知系统已就绪', {
              message: '调度器提醒功能正常工作',
              autoClose: 3000,
            });
          }
        }

        console.log('✅ [Notification] 通知功能测试完成');
      } catch (error) {
        console.error('❌ [Notification] 通知功能测试失败:', error);
        // 测试失败不应该阻断正常流程
      }
    },
    cleanup: async () => {
      // 测试任务不需要特殊清理
    },
  };

  // 注册所有任务
  manager.registerTask(notificationInitTask); // APP_STARTUP
  manager.registerTask(reminderNotificationTask); // USER_LOGIN
  manager.registerTask(notificationPermissionTask); // USER_LOGIN
  manager.registerTask(notificationTestTask); // USER_LOGIN

  console.log('📝 [Notification] 通知模块初始化任务已注册');
}

