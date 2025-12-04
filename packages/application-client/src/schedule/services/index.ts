/**
 * Schedule Module Services
 */

// Container
export { ScheduleContainer } from '../ScheduleContainer';

// Events
export {
  ScheduleTaskEvents,
  ScheduleEventEvents,
  type ScheduleTaskRefreshEvent,
  type ScheduleEventRefreshEvent,
  type ScheduleConflictEvent,
} from './schedule-events';

// ===== Schedule Task Use Cases =====

export {
  CreateScheduleTask,
  createScheduleTask,
  type CreateScheduleTaskInput,
} from './create-schedule-task';

export {
  CreateScheduleTasksBatch,
  createScheduleTasksBatch,
  type CreateScheduleTasksBatchInput,
} from './create-schedule-tasks-batch';

export { ListScheduleTasks, listScheduleTasks } from './list-schedule-tasks';

export { GetScheduleTask, getScheduleTask } from './get-schedule-task';

export {
  GetDueTasks,
  getDueTasks,
  type GetDueTasksInput,
} from './get-due-tasks';

export {
  GetTaskBySource,
  getTaskBySource,
  type GetTaskBySourceInput,
} from './get-task-by-source';

export { PauseScheduleTask, pauseScheduleTask } from './pause-schedule-task';

export { ResumeScheduleTask, resumeScheduleTask } from './resume-schedule-task';

export {
  CompleteScheduleTask,
  completeScheduleTask,
  type CompleteScheduleTaskInput,
} from './complete-schedule-task';

export {
  CancelScheduleTask,
  cancelScheduleTask,
  type CancelScheduleTaskInput,
} from './cancel-schedule-task';

export { DeleteScheduleTask, deleteScheduleTask } from './delete-schedule-task';

export { DeleteScheduleTasksBatch, deleteScheduleTasksBatch } from './delete-schedule-tasks-batch';

export {
  UpdateTaskMetadata,
  updateTaskMetadata,
  type UpdateTaskMetadataInput,
} from './update-task-metadata';

export { GetScheduleStatistics, getScheduleStatistics } from './get-schedule-statistics';

export { GetModuleStatistics, getModuleStatistics } from './get-module-statistics';

export { GetAllModuleStatistics, getAllModuleStatistics } from './get-all-module-statistics';

export { RecalculateStatistics, recalculateStatistics } from './recalculate-statistics';

export { ResetStatistics, resetStatistics } from './reset-statistics';

export { DeleteStatistics, deleteStatistics } from './delete-statistics';

// ===== Schedule Event Use Cases =====

export {
  CreateScheduleEvent,
  createScheduleEvent,
  type CreateScheduleEventInput,
} from './create-schedule-event';

export { GetScheduleEvent, getScheduleEvent } from './get-schedule-event';

export { ListSchedulesByAccount, listSchedulesByAccount } from './list-schedules-by-account';

export {
  GetSchedulesByTimeRange,
  getSchedulesByTimeRange,
  type GetSchedulesByTimeRangeInput,
} from './get-schedules-by-time-range';

export {
  UpdateScheduleEvent,
  updateScheduleEvent,
  type UpdateScheduleEventInput,
} from './update-schedule-event';

export { DeleteScheduleEvent, deleteScheduleEvent } from './delete-schedule-event';

export { GetScheduleConflicts, getScheduleConflicts } from './get-schedule-conflicts';

// ===== Schedule Conflict Use Cases =====

export {
  DetectConflicts,
  detectConflicts,
  type DetectConflictsInput,
} from './detect-conflicts';

export {
  CreateScheduleWithConflict,
  createScheduleWithConflict,
  type CreateScheduleWithConflictInput,
  type CreateScheduleWithConflictResult,
} from './create-schedule-with-conflict';

export {
  ResolveConflict,
  resolveConflict,
  type ResolveConflictInput,
  type ResolveConflictResult,
} from './resolve-conflict';

// ===== Legacy exports for backward compatibility (deprecated) =====

// Schedule Event Service
export {
  ScheduleEventApplicationService,
  createScheduleEventApplicationService,
} from './ScheduleEventApplicationService';

// Schedule Conflict Service
export {
  ScheduleConflictApplicationService,
  createScheduleConflictApplicationService,
  type DetectConflictsParams,
  type CreateScheduleResult,
  type ResolveConflictResult as LegacyResolveConflictResult,
} from './ScheduleConflictApplicationService';

// Schedule Task Service
export {
  ScheduleTaskApplicationService,
  createScheduleTaskApplicationService,
} from './ScheduleTaskApplicationService';
