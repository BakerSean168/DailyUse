/**
 * Reminder Application Services
 *
 * Named exports for all reminder-related application services.
 */

// Container
export { ReminderContainer } from '../ReminderContainer';

// Events
export {
  ReminderTemplateEvents,
  ReminderGroupEvents,
  type ReminderTemplateRefreshEvent,
  type ReminderGroupRefreshEvent,
} from './reminder-events';

// Reminder Template Use Cases
export {
  CreateReminderTemplate,
  createReminderTemplate,
  type CreateReminderTemplateInput,
} from './create-reminder-template';

export { GetReminderTemplate, getReminderTemplate } from './get-reminder-template';

export {
  ListReminderTemplates,
  listReminderTemplates,
  type ListReminderTemplatesParams,
  type ListReminderTemplatesResult,
} from './list-reminder-templates';

export { GetUserTemplates, getUserTemplates } from './get-user-templates';

export {
  UpdateReminderTemplate,
  updateReminderTemplate,
  type UpdateReminderTemplateInput,
} from './update-reminder-template';

export { DeleteReminderTemplate, deleteReminderTemplate } from './delete-reminder-template';

export { ToggleTemplateEnabled, toggleTemplateEnabled } from './toggle-template-enabled';

export {
  MoveTemplateToGroup,
  moveTemplateToGroup,
  type MoveTemplateToGroupInput,
} from './move-template-to-group';

export {
  SearchTemplates,
  searchTemplates,
  type SearchTemplatesInput,
} from './search-templates';

export { GetTemplateScheduleStatus, getTemplateScheduleStatus } from './get-template-schedule-status';

export {
  GetUpcomingReminders,
  getUpcomingReminders,
  type GetUpcomingRemindersParams,
} from './get-upcoming-reminders';

// Reminder Group Use Cases
export {
  CreateReminderGroup,
  createReminderGroup,
  type CreateReminderGroupInput,
} from './create-reminder-group';

export { GetReminderGroup, getReminderGroup } from './get-reminder-group';

export {
  ListReminderGroups,
  listReminderGroups,
  type ListReminderGroupsParams,
  type ListReminderGroupsResult,
} from './list-reminder-groups';

export { GetUserReminderGroups, getUserReminderGroups } from './get-user-reminder-groups';

export {
  UpdateReminderGroup,
  updateReminderGroup,
  type UpdateReminderGroupInput,
} from './update-reminder-group';

export { DeleteReminderGroup, deleteReminderGroup } from './delete-reminder-group';

export { ToggleReminderGroupStatus, toggleReminderGroupStatus } from './toggle-reminder-group-status';

export { ToggleReminderGroupControlMode, toggleReminderGroupControlMode } from './toggle-reminder-group-control-mode';

// Reminder Statistics Use Cases
export { GetReminderStatistics, getReminderStatistics } from './get-reminder-statistics';

// Legacy exports for backward compatibility (deprecated)
export {
  ReminderTemplateApplicationService,
  createReminderTemplateApplicationService,
} from './ReminderTemplateApplicationService';

export {
  ReminderGroupApplicationService,
  createReminderGroupApplicationService,
} from './ReminderGroupApplicationService';

export {
  ReminderStatisticsApplicationService,
  createReminderStatisticsApplicationService,
} from './ReminderStatisticsApplicationService';
