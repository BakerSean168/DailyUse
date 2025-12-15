/**
 * Task IPC Clients - 统一导出
 * 
 * @module renderer/modules/task/infrastructure/ipc
 */

// Template Client
export {
  TaskTemplateIPCClient,
  taskTemplateIPCClient,
} from './task-template.ipc-client';
export type { TaskTemplateDTO, TaskFolderDTO } from './task-template.ipc-client';

// Instance Client
export {
  TaskInstanceIPCClient,
  taskInstanceIPCClient,
} from './task-instance.ipc-client';
export type { TaskInstanceDTO, TaskInstanceCompleteResult } from './task-instance.ipc-client';

// Statistics Client
export {
  TaskStatisticsIPCClient,
  taskStatisticsIPCClient,
} from './task-statistics.ipc-client';
export type {
  TaskStatisticsDTO,
  DailyTaskStatistics,
  WeeklyTaskStatistics,
  MonthlyTaskStatistics,
  TaskTrendData,
} from './task-statistics.ipc-client';
