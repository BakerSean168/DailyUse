/**
 * Main Process Utilities Module
 *
 * Exports utility functions and classes used throughout the main process, including:
 * - Pagination helpers
 * - Memory monitoring
 * - IPC caching
 * - IPC data compression
 * - IPC handler creation and registration
 *
 * @module utils
 */

// Pagination
export {
  normalizePaginationParams,
  calculateOffset,
  createPaginatedResult,
  paginateArray,
  normalizeCursorParams,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  type PaginationParams,
  type PaginatedResult,
  type CursorPaginationParams,
  type CursorPaginatedResult,
} from './pagination';

// Memory Monitor
export {
  MemoryMonitor,
  getMemoryMonitor,
  registerMemoryMonitorIpcHandlers,
  initMemoryMonitorForDev,
} from './memory-monitor';

// IPC Cache
export {
  IpcCache,
  getIpcCache,
  withCache,
  invalidatesCache,
  registerCacheIpcHandlers,
} from './ipc-cache';

// IPC Compression
export {
  compressForIpc,
  decompressFromIpc,
  isCompressedPayload,
  getCompressionStats,
  withCompression,
  autoDecompress,
  compressBatch,
  decompressBatch,
  IpcCompressionClient,
  getCompressionClient,
  analyzeCompressionBenefit,
  COMPRESSION_THRESHOLD,
  DEFAULT_COMPRESSION_LEVEL,
  type CompressionStats,
  type CompressedPayload,
  type CompressionOptions,
} from './ipc-compression';

// IPC Handler Utilities
export {
  createIpcHandler,
  registerIpcHandler,
  registerIpcHandlers,
  createModuleIpcHandlers,
  removeIpcHandlers,
  type IpcHandlerFn,
  type IpcHandlerOptions,
  type IpcHandlerDefinition,
} from './ipc-handler';
