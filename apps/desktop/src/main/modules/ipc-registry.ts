/**
 * IPC 处理器统一注册中心
 * 
 * 集中管理所有模块的 IPC 处理器注册
 * 
 * 功能：
 * - 统一初始化所有 IPC 处理器
 * - 提供模块化的处理器管理
 * - 日志记录处理器注册状态
 */

import { createLogger } from '@dailyuse/utils';

// Import all IPC handlers
import { aiIPCHandler } from './ai/ipc/ai-ipc-handler';
import { taskIPCHandler } from './task/ipc/task-ipc-handler';
import { goalIPCHandler } from './goal/ipc/goal-ipc-handler';
import { scheduleIPCHandler } from './schedule/ipc/schedule-ipc-handler';
import { notificationIPCHandler } from './notification/ipc/notification-ipc-handler';
import { repositoryIPCHandler } from './repository/ipc/repository-ipc-handler';
import { dashboardIPCHandler } from './dashboard/ipc/dashboard-ipc-handler';
import { accountIPCHandler } from './account/ipc/account-ipc-handler';
import { authIPCHandler } from './authentication/ipc/auth-ipc-handler';
import { settingIPCHandler } from './setting/ipc/setting-ipc-handler';

const logger = createLogger('IPCRegistry');

/**
 * 所有 IPC 处理器实例
 */
export const ipcHandlers = {
  ai: aiIPCHandler,
  task: taskIPCHandler,
  goal: goalIPCHandler,
  schedule: scheduleIPCHandler,
  notification: notificationIPCHandler,
  repository: repositoryIPCHandler,
  dashboard: dashboardIPCHandler,
  account: accountIPCHandler,
  auth: authIPCHandler,
  setting: settingIPCHandler,
};

/**
 * 初始化所有 IPC 处理器
 * 
 * 在 Electron main 进程启动时调用
 */
export function initializeIPCHandlers(): void {
  const startTime = performance.now();
  
  logger.info('Initializing IPC handlers...');
  
  // 所有处理器在构造时自动注册
  // 这里只是确保它们被实例化
  const handlerCount = Object.keys(ipcHandlers).length;
  
  const duration = performance.now() - startTime;
  logger.info(`IPC handlers initialized`, {
    count: handlerCount,
    duration: `${duration.toFixed(2)}ms`,
    modules: Object.keys(ipcHandlers),
  });
}

/**
 * 获取 IPC 处理器统计信息
 */
export function getIPCHandlerStats(): {
  totalHandlers: number;
  modules: string[];
} {
  return {
    totalHandlers: Object.keys(ipcHandlers).length,
    modules: Object.keys(ipcHandlers),
  };
}

export {
  aiIPCHandler,
  taskIPCHandler,
  goalIPCHandler,
  scheduleIPCHandler,
  notificationIPCHandler,
  repositoryIPCHandler,
  dashboardIPCHandler,
  accountIPCHandler,
  authIPCHandler,
  settingIPCHandler,
};
