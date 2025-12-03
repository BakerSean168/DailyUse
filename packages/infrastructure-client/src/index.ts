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
  type IGoalApiClient,
  type IGoalFolderApiClient,
  type ITaskApiClient,
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
  GoalHttpAdapter,
  createGoalHttpAdapter,
  GoalFolderHttpAdapter,
  createGoalFolderHttpAdapter,
  type HttpClient,
  type HttpClientConfig,
} from './adapters/http';

// ============================================================
// IPC Adapters (for Desktop Renderer)
// ============================================================
export {
  GoalIpcAdapter,
  createGoalIpcAdapter,
  GoalFolderIpcAdapter,
  createGoalFolderIpcAdapter,
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
