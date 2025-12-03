/**
 * Infrastructure Ports (Client)
 *
 * Interface definitions for client-side infrastructure.
 * These ports define contracts that adapters must implement.
 */

// API Client Ports
export {
  type IGoalApiClient,
  type IGoalFolderApiClient,
  type ITaskApiClient,
  type IScheduleApiClient,
  type IReminderApiClient,
  type IAccountApiClient,
} from './api-clients';

// Storage Ports
export { type IStorage, type ICacheStorage } from './storage';
