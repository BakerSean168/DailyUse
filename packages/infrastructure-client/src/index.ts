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
 *
 * Module Structure:
 * - goal/          - Goal module ports & adapters
 * - task/          - Task module ports & adapters
 * - schedule/      - Schedule module ports & adapters
 * - reminder/      - Reminder module ports & adapters
 * - account/       - Account module ports & adapters
 * - authentication/ - Authentication module ports & adapters
 * - notification/  - Notification module ports & adapters
 * - shared/        - Shared types (HTTP/IPC clients, Storage)
 */

// ============================================================
// Goal Module
// ============================================================
export {
  type IGoalApiClient,
  type IGoalFolderApiClient,
  GoalHttpAdapter,
  createGoalHttpAdapter,
  GoalFolderHttpAdapter,
  createGoalFolderHttpAdapter,
  GoalIpcAdapter,
  createGoalIpcAdapter,
  GoalFolderIpcAdapter,
  createGoalFolderIpcAdapter,
} from './goal';

// ============================================================
// Task Module
// ============================================================
export {
  type ITaskTemplateApiClient,
  type ITaskInstanceApiClient,
  type ITaskDependencyApiClient,
  type ITaskStatisticsApiClient,
  TaskTemplateHttpAdapter,
  createTaskTemplateHttpAdapter,
  TaskInstanceHttpAdapter,
  createTaskInstanceHttpAdapter,
  TaskDependencyHttpAdapter,
  createTaskDependencyHttpAdapter,
  TaskStatisticsHttpAdapter,
  createTaskStatisticsHttpAdapter,
  TaskTemplateIpcAdapter,
  createTaskTemplateIpcAdapter,
  TaskInstanceIpcAdapter,
  createTaskInstanceIpcAdapter,
  TaskDependencyIpcAdapter,
  createTaskDependencyIpcAdapter,
  TaskStatisticsIpcAdapter,
  createTaskStatisticsIpcAdapter,
} from './task';

// ============================================================
// Schedule Module
// ============================================================
export {
  type IScheduleTaskApiClient,
  type IScheduleEventApiClient,
  ScheduleTaskHttpAdapter,
  createScheduleTaskHttpAdapter,
  ScheduleEventHttpAdapter,
  createScheduleEventHttpAdapter,
  ScheduleTaskIpcAdapter,
  createScheduleTaskIpcAdapter,
  ScheduleEventIpcAdapter,
  createScheduleEventIpcAdapter,
} from './schedule';

// ============================================================
// Reminder Module
// ============================================================
export {
  type IReminderApiClient,
  type ReminderTemplatesResponse,
  type ReminderGroupsResponse,
  ReminderHttpAdapter,
  createReminderHttpAdapter,
  ReminderIpcAdapter,
  createReminderIpcAdapter,
} from './reminder';

// ============================================================
// Account Module
// ============================================================
export {
  type IAccountApiClient,
  AccountHttpAdapter,
  createAccountHttpAdapter,
  AccountIpcAdapter,
  createAccountIpcAdapter,
} from './account';

// ============================================================
// Authentication Module
// ============================================================
export {
  type IAuthApiClient,
  type RegisterResponse,
  AuthHttpAdapter,
  createAuthHttpAdapter,
  AuthIpcAdapter,
  createAuthIpcAdapter,
} from './authentication';

// ============================================================
// Notification Module
// ============================================================
export {
  type INotificationApiClient,
  type CreateNotificationRequest,
  type QueryNotificationsRequest,
  type NotificationListResponse,
  type UnreadCountResponse,
  NotificationHttpAdapter,
  createNotificationHttpAdapter,
  NotificationIpcAdapter,
  createNotificationIpcAdapter,
} from './notification';

// ============================================================
// Shared (Types and Utilities)
// ============================================================
export {
  type HttpClient,
  type IHttpClient,
  type HttpClientConfig,
  type IpcClient,
  type ElectronAPI,
  type IStorage,
  type ICacheStorage,
  LocalStorageAdapter,
  MemoryCacheAdapter,
} from './shared';

// ============================================================
// Dependency Injection (DI)
// ============================================================
export {
  // Core Container
  DIContainer,
  DependencyKeys,
  type DependencyKey,
  // Module Containers
  GoalContainer,
  TaskContainer,
  ScheduleContainer,
  ReminderContainer,
  AccountContainer,
  AuthenticationContainer,
  NotificationContainer,
  // Composition Roots
  configureWebDependencies,
  configureDesktopDependencies,
} from './di';
