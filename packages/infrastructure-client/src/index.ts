/**
 * @dailyuse/infrastructure-client
 *
 * Client Infrastructure Layer - Ports & Adapters
 *
 * This package implements the Hexagonal Architecture (Ports & Adapters) pattern
 * for client-side applications. It provides:
 *
 * - Ports: Interface definitions for external dependencies
 * - Adapters: Concrete implementations for different environments
 *   - HTTP: REST API clients for web applications
 *   - IPC: Electron IPC clients for desktop renderer
 *   - Storage: Local storage adapters
 */

// ============================================================
// Ports (Interfaces)
// ============================================================
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
  // Storage
  type IStorage,
  type ICacheStorage,
} from './ports';

// ============================================================
// HTTP Adapters (for Web)
// ============================================================
export {
  // Goal
  GoalHttpAdapter,
  createGoalHttpAdapter,
  GoalFolderHttpAdapter,
  createGoalFolderHttpAdapter,
  // Task
  TaskTemplateHttpAdapter,
  createTaskTemplateHttpAdapter,
  TaskInstanceHttpAdapter,
  createTaskInstanceHttpAdapter,
  TaskDependencyHttpAdapter,
  createTaskDependencyHttpAdapter,
  TaskStatisticsHttpAdapter,
  createTaskStatisticsHttpAdapter,
  // Schedule
  ScheduleTaskHttpAdapter,
  createScheduleTaskHttpAdapter,
  ScheduleEventHttpAdapter,
  createScheduleEventHttpAdapter,
  // Reminder
  ReminderHttpAdapter,
  createReminderHttpAdapter,
  // Account
  AccountHttpAdapter,
  createAccountHttpAdapter,
  // Types
  type HttpClient,
  type HttpClientConfig,
} from './adapters/http';

// ============================================================
// IPC Adapters (for Desktop Renderer)
// ============================================================
export {
  // Goal
  GoalIpcAdapter,
  createGoalIpcAdapter,
  GoalFolderIpcAdapter,
  createGoalFolderIpcAdapter,
  // Task
  TaskTemplateIpcAdapter,
  createTaskTemplateIpcAdapter,
  TaskInstanceIpcAdapter,
  createTaskInstanceIpcAdapter,
  TaskDependencyIpcAdapter,
  createTaskDependencyIpcAdapter,
  TaskStatisticsIpcAdapter,
  createTaskStatisticsIpcAdapter,
  // Schedule
  ScheduleTaskIpcAdapter,
  createScheduleTaskIpcAdapter,
  ScheduleEventIpcAdapter,
  createScheduleEventIpcAdapter,
  // Reminder
  ReminderIpcAdapter,
  createReminderIpcAdapter,
  // Account
  AccountIpcAdapter,
  createAccountIpcAdapter,
  // Types
  type IpcClient,
  type ElectronAPI,
} from './adapters/ipc';

// ============================================================
// Storage Adapters
// ============================================================
export {
  LocalStorageAdapter,
  MemoryCacheAdapter,
} from './adapters/storage';
