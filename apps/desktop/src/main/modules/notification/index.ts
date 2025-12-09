/**
 * Notification Module - Main Entry
 *
 * 通知模块入口
 * - 注册 InitializationManager 任务
 * - 统一管理 Notification 模块的初始化和清理
 */

import { InitializationManager, InitializationPhase } from '@dailyuse/utils';
import { createLogger } from '@dailyuse/utils';

import { registerNotificationIpcHandlers, unregisterNotificationIpcHandlers } from './ipc/notification.ipc-handlers';

const logger = createLogger('NotificationModule');

/**
 * 注册 Notification 模块到 InitializationManager
 */
export function registerNotificationModule(): void {
  const manager = InitializationManager.getInstance();

  manager.registerTask({
    name: 'notification-module',
    phase: InitializationPhase.APP_STARTUP,
    priority: 45, // Notification 模块优先级（作为核心服务，在 Goal 之前）
    initialize: async () => {
      logger.info('Initializing Notification module...');

      // 注册所有 IPC handlers
      registerNotificationIpcHandlers();

      logger.info('Notification module initialized (12 IPC channels)');
    },
    cleanup: async () => {
      logger.info('Cleaning up Notification module...');

      // 注销所有 IPC handlers
      unregisterNotificationIpcHandlers();

      logger.info('Notification module cleanup complete');
    },
  });

  logger.info('Notification module registered');
}

// Re-export sub-modules
export * from './application/NotificationDesktopApplicationService';
export * from './ipc/notification.ipc-handlers';
