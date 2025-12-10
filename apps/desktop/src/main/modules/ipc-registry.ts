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
import { taskTemplateIPCHandler } from './task/ipc/task-template.ipc-handlers';
import { taskInstanceIPCHandler } from './task/ipc/task-instance.ipc-handlers';
import { taskDependencyIPCHandler } from './task/ipc/task-dependency.ipc-handlers';
import { taskStatisticsIPCHandler } from './task/ipc/task-statistics.ipc-handlers';
import { goalIPCHandler } from './goal/ipc/goal-ipc-handler';
import { goalFolderIPCHandler } from './goal/ipc/goal-folder.ipc-handlers';
import { scheduleIPCHandler } from './schedule/ipc/schedule-ipc-handler';
import { ScheduleTaskIPCHandler } from './schedule/ipc/schedule-task.ipc-handlers';
import { ScheduleStatisticsIPCHandler } from './schedule/ipc/schedule-statistics.ipc-handlers';
import { NotificationIPCHandler } from './notification/ipc/notification.ipc-handlers';
import { RepositoryIPCHandler } from './repository/ipc/repository.ipc-handlers';
import { DashboardIPCHandler } from './dashboard/ipc/dashboard.ipc-handlers';
import { ReminderTemplateIPCHandler } from './reminder/ipc/reminder-template.ipc-handlers';
import { ReminderGroupIPCHandler } from './reminder/ipc/reminder-group.ipc-handlers';
import { ReminderStatisticsIPCHandler } from './reminder/ipc/reminder-statistics.ipc-handlers';
import { accountIPCHandler } from './account/ipc/account-ipc-handler';
import { authIPCHandler } from './authentication/ipc/auth-ipc-handler';
import { SettingIPCHandler } from './setting/ipc/setting.ipc-handlers';

const logger = createLogger('IPCRegistry');

/**
 * 所有 IPC 处理器实例
 */
export const ipcHandlers = {
  ai: aiIPCHandler,
  task: taskIPCHandler,
  taskTemplate: taskTemplateIPCHandler,
  taskInstance: taskInstanceIPCHandler,
  taskDependency: taskDependencyIPCHandler,
  taskStatistics: taskStatisticsIPCHandler,
  goal: goalIPCHandler,
  goalFolder: goalFolderIPCHandler,
  schedule: scheduleIPCHandler,
  scheduleTask: new ScheduleTaskIPCHandler(),
  scheduleStatistics: new ScheduleStatisticsIPCHandler(),
  notification: new NotificationIPCHandler(),
  repository: new RepositoryIPCHandler(),
  dashboard: new DashboardIPCHandler(),
  reminderTemplate: new ReminderTemplateIPCHandler(),
  reminderGroup: new ReminderGroupIPCHandler(),
  reminderStatistics: new ReminderStatisticsIPCHandler(),
  account: accountIPCHandler,
  auth: authIPCHandler,
  setting: new SettingIPCHandler(),
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
  taskTemplateIPCHandler,
  taskInstanceIPCHandler,
  taskDependencyIPCHandler,
  taskStatisticsIPCHandler,
  goalIPCHandler,
  goalFolderIPCHandler,
  scheduleIPCHandler,
  ScheduleTaskIPCHandler,
  ScheduleStatisticsIPCHandler,
  NotificationIPCHandler,
  RepositoryIPCHandler,
  DashboardIPCHandler,
  ReminderTemplateIPCHandler,
  ReminderGroupIPCHandler,
  ReminderStatisticsIPCHandler,
  accountIPCHandler,
  authIPCHandler,
  SettingIPCHandler,
};
