/**
 * IPC Adapters
 *
 * Electron IPC client implementations for desktop renderer process.
 * These communicate with the main process via Electron's IPC.
 */

// Goal Module
export { GoalIpcAdapter, createGoalIpcAdapter } from './goal-ipc.adapter';
export { GoalFolderIpcAdapter, createGoalFolderIpcAdapter } from './goal-folder-ipc.adapter';

// Task Module
export {
  TaskTemplateIpcAdapter,
  createTaskTemplateIpcAdapter,
} from './task-template-ipc.adapter';
export {
  TaskInstanceIpcAdapter,
  createTaskInstanceIpcAdapter,
} from './task-instance-ipc.adapter';
export {
  TaskDependencyIpcAdapter,
  createTaskDependencyIpcAdapter,
} from './task-dependency-ipc.adapter';
export {
  TaskStatisticsIpcAdapter,
  createTaskStatisticsIpcAdapter,
} from './task-statistics-ipc.adapter';

// Schedule Module
export {
  ScheduleTaskIpcAdapter,
  createScheduleTaskIpcAdapter,
} from './schedule-task-ipc.adapter';
export {
  ScheduleEventIpcAdapter,
  createScheduleEventIpcAdapter,
} from './schedule-event-ipc.adapter';

// Reminder Module
export {
  ReminderIpcAdapter,
  createReminderIpcAdapter,
} from './reminder-ipc.adapter';

// Account Module
export {
  AccountIpcAdapter,
  createAccountIpcAdapter,
} from './account-ipc.adapter';

// Re-export types
export type { IpcClient, ElectronAPI } from './ipc-client.types';
