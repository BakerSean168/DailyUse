/**
 * Goal IPC Clients - 统一导出
 * 
 * @module renderer/modules/goal/infrastructure/ipc
 */

// Goal Client
export {
  GoalIPCClient,
  goalIPCClient,
} from './goal.ipc-client';
export type {
  GoalDTO,
  GoalStatus,
  GoalFolderDTO,
  GoalStatisticsDTO,
} from './goal.ipc-client';

// Focus Client
export {
  GoalFocusIPCClient,
  goalFocusIPCClient,
} from './goal-focus.ipc-client';
export type {
  FocusSessionDTO,
  FocusSessionStatus,
  FocusStatusDTO,
  FocusHistoryDTO,
  FocusStatisticsDTO,
  PomodoroConfigDTO,
} from './goal-focus.ipc-client';
