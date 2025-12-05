/**
 * Task Application Services
 *
 * Named exports for all task-related application services.
 */

// Container
export { TaskContainer } from '@dailyuse/infrastructure-client';

// Events
export { TaskEvents, TaskInstanceEvents } from './task-events';
export {
  TaskDependencyEvents,
  type TaskDependencyRefreshEvent,
} from './task-dependency-events';

// Task Template Use Cases
export {
  CreateTaskTemplate,
  createTaskTemplate,
  type CreateTaskTemplateInput,
} from './create-task-template';

export { ListTaskTemplates, listTaskTemplates } from './list-task-templates';

export { GetTaskTemplate, getTaskTemplate } from './get-task-template';

export {
  UpdateTaskTemplate,
  updateTaskTemplate,
  type UpdateTaskTemplateInput,
} from './update-task-template';

export { DeleteTaskTemplate, deleteTaskTemplate } from './delete-task-template';

export { ActivateTaskTemplate, activateTaskTemplate } from './activate-task-template';

export { PauseTaskTemplate, pauseTaskTemplate } from './pause-task-template';

export { ArchiveTaskTemplate, archiveTaskTemplate } from './archive-task-template';

export {
  GenerateTaskInstances,
  generateTaskInstances,
  type GenerateTaskInstancesInput,
} from './generate-task-instances';

export {
  GetInstancesByDateRange,
  getInstancesByDateRange,
  type GetInstancesByDateRangeInput,
} from './get-instances-by-date-range';

export {
  BindTaskToGoal,
  bindTaskToGoal,
  type BindTaskToGoalInput,
} from './bind-task-to-goal';

export { UnbindTaskFromGoal, unbindTaskFromGoal } from './unbind-task-from-goal';

// Task Instance Use Cases
export {
  ListTaskInstances,
  listTaskInstances,
  type ListTaskInstancesParams,
} from './list-task-instances';

export { GetTaskInstance, getTaskInstance } from './get-task-instance';

export { DeleteTaskInstance, deleteTaskInstance } from './delete-task-instance';

export { StartTaskInstance, startTaskInstance } from './start-task-instance';

export { CompleteTaskInstance, completeTaskInstance } from './complete-task-instance';

export { SkipTaskInstance, skipTaskInstance } from './skip-task-instance';

export {
  CheckExpiredInstances,
  checkExpiredInstances,
  type CheckExpiredInstancesResult,
} from './check-expired-instances';

// Task Dependency Use Cases
export {
  CreateTaskDependency,
  createTaskDependency,
  type CreateTaskDependencyInput,
} from './create-task-dependency';

export { GetTaskDependencies, getTaskDependencies } from './get-task-dependencies';

export { GetTaskDependents, getTaskDependents } from './get-task-dependents';

export { GetDependencyChain, getDependencyChain } from './get-dependency-chain';

export { ValidateTaskDependency, validateTaskDependency } from './validate-task-dependency';

export {
  UpdateTaskDependency,
  updateTaskDependency,
  type UpdateTaskDependencyInput,
} from './update-task-dependency';

export {
  DeleteTaskDependency,
  deleteTaskDependency,
  type DeleteTaskDependencyInput,
} from './delete-task-dependency';

// Task Statistics Use Cases
export {
  GetTaskStatistics,
  getTaskStatistics,
  type GetTaskStatisticsInput,
} from './get-task-statistics';

export {
  RecalculateTaskStatistics,
  recalculateTaskStatistics,
  type RecalculateStatisticsInput,
} from './recalculate-task-statistics';

export { DeleteTaskStatistics, deleteTaskStatistics } from './delete-task-statistics';

export { UpdateTemplateStats, updateTemplateStats } from './update-template-stats';

export { UpdateInstanceStats, updateInstanceStats } from './update-instance-stats';

export { UpdateCompletionStats, updateCompletionStats } from './update-completion-stats';

export { GetTodayCompletionRate, getTodayCompletionRate } from './get-today-completion-rate';

export { GetWeekCompletionRate, getWeekCompletionRate } from './get-week-completion-rate';

export {
  GetEfficiencyTrend,
  getEfficiencyTrend,
  type EfficiencyTrend,
} from './get-efficiency-trend';

// Legacy exports for backward compatibility (deprecated)
export {
  TaskTemplateApplicationService,
  createTaskTemplateService,
  type TaskTemplateRefreshEvent,
} from './TaskTemplateApplicationService';

export {
  TaskInstanceApplicationService,
  createTaskInstanceService,
  type TaskInstanceRefreshEvent,
} from './TaskInstanceApplicationService';

export {
  TaskDependencyApplicationService,
  createTaskDependencyService,
} from './TaskDependencyApplicationService';

export {
  TaskStatisticsApplicationService,
  createTaskStatisticsService,
} from './TaskStatisticsApplicationService';
