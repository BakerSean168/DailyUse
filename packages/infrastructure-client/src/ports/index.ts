/**
 * Infrastructure Ports (Client)
 *
 * Interface definitions for client-side infrastructure.
 * These ports define contracts that adapters must implement.
 */

// API Client Ports
export {
  // Goal Module
  type IGoalApiClient,
  type IGoalFolderApiClient,
  // Task Module
  type ITaskTemplateApiClient,
  type ITaskInstanceApiClient,
  type ITaskDependencyApiClient,
  type ITaskStatisticsApiClient,
  // Other Modules
  type IScheduleApiClient,
  type IReminderApiClient,
  type IAccountApiClient,
} from './api-clients';

// Storage Ports
export { type IStorage, type ICacheStorage } from './storage';
