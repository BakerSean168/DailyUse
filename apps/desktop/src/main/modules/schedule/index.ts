/**
 * Schedule Module - Main Entry
 *
 * 调度模块入口
 * - 注册 InitializationManager 任务
 * - 统一管理 Schedule 模块的初始化和清理
 */

import { InitializationManager, InitializationPhase } from '@dailyuse/utils';
import { createLogger } from '@dailyuse/utils';

import { registerScheduleTaskIpcHandlers, unregisterScheduleTaskIpcHandlers } from './ipc/schedule-task.ipc-handlers';
import { registerScheduleStatisticsIpcHandlers, unregisterScheduleStatisticsIpcHandlers } from './ipc/schedule-statistics.ipc-handlers';

const logger = createLogger('ScheduleModule');

/**
 * 注册 Schedule 模块到 InitializationManager
 */
export function registerScheduleModule(): void {
  const manager = InitializationManager.getInstance();

  manager.registerTask({
    name: 'schedule-module',
    phase: InitializationPhase.APP_STARTUP,
    priority: 70, // Schedule 模块优先级（在 Task 模块之后）
    initialize: async () => {
      logger.info('Initializing Schedule module...');

      // 注册所有 IPC handlers
      registerScheduleTaskIpcHandlers();
      registerScheduleStatisticsIpcHandlers();

      logger.info('Schedule module initialized (13 IPC channels)');
    },
    cleanup: async () => {
      logger.info('Cleaning up Schedule module...');

      // 注销所有 IPC handlers
      unregisterScheduleTaskIpcHandlers();
      unregisterScheduleStatisticsIpcHandlers();

      logger.info('Schedule module cleanup complete');
    },
  });

  logger.info('Schedule module registered');
}

// Re-export sub-modules
export * from './application/ScheduleDesktopApplicationService';
export * from './ipc/schedule-task.ipc-handlers';
export * from './ipc/schedule-statistics.ipc-handlers';
