/**
 * @fileoverview 云同步适配器模块导出
 * @module @dailyuse/application-client/sync
 */

// 接口
export type { ISyncAdapter, SyncAdapterConstructor } from './interfaces/ISyncAdapter';

// 类型
export type {
  AdapterConfig,
  AdapterCredentials,
  BatchPushResult,
  ConflictInfo,
  ConflictResolution,
  EncryptedSyncData,
  ExportData,
  HealthStatus,
  ImportOptions,
  PullResult,
  PushResult,
  QuotaInfo,
  RemoteVersionInfo,
  SyncCursor,
} from './types';

// 工厂
export { SyncAdapterFactory } from './factory/AdapterFactory';

// 错误类型
export {
  AuthenticationError,
  ConflictError,
  NetworkError,
  NotFoundError,
  QuotaExceededError,
  SyncError,
  ValidationError,
} from './errors';
