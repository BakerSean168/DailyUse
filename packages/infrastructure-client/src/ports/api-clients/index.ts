/**
 * API Client Port Interfaces
 *
 * These interfaces define the contract for communicating with backend services.
 * Implementations can use HTTP (web) or IPC (desktop).
 */

// Goal Module
export { type IGoalApiClient } from './goal-api-client.port';
export { type IGoalFolderApiClient } from './goal-folder-api-client.port';

// Task Module
export { type ITaskTemplateApiClient } from './task-template-api-client.port';
export { type ITaskInstanceApiClient } from './task-instance-api-client.port';
export { type ITaskDependencyApiClient } from './task-dependency-api-client.port';
export { type ITaskStatisticsApiClient } from './task-statistics-api-client.port';

// Schedule Module
export { type IScheduleApiClient } from './schedule-api-client.port';

// Reminder Module
export { type IReminderApiClient } from './reminder-api-client.port';

// Account Module
export { type IAccountApiClient } from './account-api-client.port';
