/**
 * Task Services Index
 *
 * 导出所有 Task 模块的 Use Case
 */

// ===== Task Template Services =====
export {
  CreateTaskTemplate,
  createTaskTemplate,
  type CreateTaskTemplateInput,
  type CreateTaskTemplateOutput,
} from './create-task-template';

export {
  CreateOneTimeTask,
  createOneTimeTask,
  type CreateOneTimeTaskInput,
  type CreateOneTimeTaskOutput,
} from './create-one-time-task';

export {
  GetTaskTemplate,
  getTaskTemplate,
  type GetTaskTemplateInput,
  type GetTaskTemplateOutput,
} from './get-task-template';

export {
  ListTaskTemplates,
  listTaskTemplates,
  type ListTaskTemplatesInput,
  type ListTaskTemplatesOutput,
} from './list-task-templates';

export {
  ActivateTaskTemplate,
  activateTaskTemplate,
  type ActivateTaskTemplateInput,
  type ActivateTaskTemplateOutput,
} from './activate-task-template';

export {
  PauseTaskTemplate,
  pauseTaskTemplate,
  type PauseTaskTemplateInput,
  type PauseTaskTemplateOutput,
} from './pause-task-template';

export {
  DeleteTaskTemplate,
  deleteTaskTemplate,
  type DeleteTaskTemplateInput,
  type DeleteTaskTemplateOutput,
} from './delete-task-template';

// ===== Task Instance Services =====
export {
  CompleteTaskInstance,
  completeTaskInstance,
  type CompleteTaskInstanceInput,
  type CompleteTaskInstanceOutput,
} from './complete-task-instance';

export {
  SkipTaskInstance,
  skipTaskInstance,
  type SkipTaskInstanceInput,
  type SkipTaskInstanceOutput,
} from './skip-task-instance';

export {
  GetTaskInstancesByDateRange,
  getTaskInstancesByDateRange,
  type GetTaskInstancesByDateRangeInput,
  type GetTaskInstancesByDateRangeOutput,
} from './get-task-instances-by-date-range';

// ===== Dashboard Services =====
export {
  GetTaskDashboard,
  getTaskDashboard,
  type GetTaskDashboardInput,
  type GetTaskDashboardOutput,
  type TaskDashboardStatistics,
} from './get-task-dashboard';
