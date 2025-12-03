/**
 * API Client Port Interfaces
 *
 * These interfaces define the contract for communicating with backend services.
 * Implementations can use HTTP (web) or IPC (desktop).
 */

export { type IGoalApiClient } from './goal-api-client.port';
export { type IGoalFolderApiClient } from './goal-folder-api-client.port';
export { type ITaskApiClient } from './task-api-client.port';
export { type IScheduleApiClient } from './schedule-api-client.port';
export { type IReminderApiClient } from './reminder-api-client.port';
export { type IAccountApiClient } from './account-api-client.port';
