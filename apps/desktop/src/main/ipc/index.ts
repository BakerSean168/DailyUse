/**
 * IPC Handlers Index
 * 
 * 统一导出所有 IPC 处理器注册函数
 */

import { registerGoalIpcHandlers } from './goal.ipc-handlers';
import { registerGoalFolderIpcHandlers } from './goal-folder.ipc-handlers';
import { registerTaskIpcHandlers } from './task.ipc-handlers';
import { registerScheduleIpcHandlers } from './schedule.ipc-handlers';
import { registerReminderIpcHandlers } from './reminder.ipc-handlers';
import { registerAiIpcHandlers } from './ai.ipc-handlers';
import { registerAuthIpcHandlers } from './auth.ipc-handlers';
import { registerAccountIpcHandlers } from './account.ipc-handlers';
import { registerNotificationIpcHandlers } from './notification.ipc-handlers';
import { registerDashboardIpcHandlers } from './dashboard.ipc-handlers';
import { registerRepositoryIpcHandlers } from './repository.ipc-handlers';
import { registerSettingIpcHandlers } from './setting.ipc-handlers';

// Re-export all handlers
export {
  registerGoalIpcHandlers,
  registerGoalFolderIpcHandlers,
  registerTaskIpcHandlers,
  registerScheduleIpcHandlers,
  registerReminderIpcHandlers,
  registerAiIpcHandlers,
  registerAuthIpcHandlers,
  registerAccountIpcHandlers,
  registerNotificationIpcHandlers,
  registerDashboardIpcHandlers,
  registerRepositoryIpcHandlers,
  registerSettingIpcHandlers,
};

/**
 * 注册所有 IPC 处理器
 */
export function registerAllIpcHandlers(): void {
  console.log('[IPC] Registering all handlers...');
  
  // Domain modules
  registerGoalIpcHandlers();
  registerGoalFolderIpcHandlers();
  registerTaskIpcHandlers();
  registerScheduleIpcHandlers();
  registerReminderIpcHandlers();
  
  // AI module
  registerAiIpcHandlers();
  
  // Auth & Account
  registerAuthIpcHandlers();
  registerAccountIpcHandlers();
  
  // System modules
  registerNotificationIpcHandlers();
  registerDashboardIpcHandlers();
  registerRepositoryIpcHandlers();
  registerSettingIpcHandlers();
  
  console.log('[IPC] All handlers registered successfully');
}
