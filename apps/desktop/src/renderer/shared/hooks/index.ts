/**
 * Shared Hooks
 *
 * Central export point for all shared React hooks used across the renderer process.
 *
 * @module renderer/shared/hooks
 */

export {
  useVirtualList,
  type VirtualListOptions,
  type VirtualListResult,
  type VirtualItem,
} from './useVirtualList';

export {
  useInfiniteLoad,
  type UseInfiniteLoadOptions,
  type UseInfiniteLoadResult,
} from './useInfiniteLoad';

export {
  useAutoCleanup,
  type UseAutoCleanupOptions,
} from './useAutoCleanup';

export {
  useSyncStatus,
  type SyncState,
  type SyncSummary,
  type UseSyncStatusResult,
} from './useSyncStatus';

export {
  useConflicts,
  type ConflictRecord,
  type UseConflictsResult,
} from './useConflicts';
