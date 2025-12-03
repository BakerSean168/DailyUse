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
  // Other Modules
  type IScheduleApiClient,
  type IReminderApiClient,
  type IAccountApiClient,
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
