/**
 * IPC Infrastructure - 统一导出
 * 
 * @module renderer/shared/infrastructure/ipc
 */

// Types
export type {
  IPCResponse,
  IPCErrorData,
  IPCRequestOptions,
  BatchRequestItem,
  BatchResponseItem,
  IPCEventListener,
  IPCSubscriptionOptions,
  IPCChannelDefinition,
  IIPCClient,
} from './ipc-types';

export { IPCErrorCode } from './ipc-types';

// Errors
export {
  IPCError,
  IPCTimeoutError,
  IPCCancelledError,
  IPCValidationError,
  IPCNotFoundError,
  IPCUnauthorizedError,
  IPCForbiddenError,
  createIPCError,
  isIPCError,
  isTimeoutError,
  isCancelledError,
  isValidationError,
  isRetryableError,
} from './ipc-error';

// Logger
export type { LogLevel, IPCLogEntry, IPCLoggerConfig, IPCLogHandler } from './ipc-logger';
export { IPCLogger, ipcLogger } from './ipc-logger';

// Client
export { BaseIPCClient, ipcClient } from './base-ipc-client';
