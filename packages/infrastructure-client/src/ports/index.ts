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
  // Schedule Module
  type IScheduleTaskApiClient,
  type IScheduleEventApiClient,
  // Reminder Module
  type IReminderApiClient,
  type ReminderTemplatesResponse,
  type ReminderGroupsResponse,
  // Account Module
  type IAccountApiClient,
  // Authentication Module
  type IAuthApiClient,
  type RegisterResponse,
  // Notification Module
  type INotificationApiClient,
  type CreateNotificationRequest,
  type QueryNotificationsRequest,
  type NotificationListResponse,
  type UnreadCountResponse,
} from './api-clients';

// Storage Ports
export { type IStorage, type ICacheStorage } from './storage';
