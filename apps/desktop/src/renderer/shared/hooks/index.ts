/**
 * Shared Hooks - 统一导出
 *
 * 跨模块共享的 Hooks
 */

// 基础设施 Hooks（重新导出原有的）
export {
  useVirtualList,
  type VirtualListOptions,
  type VirtualListResult,
  type VirtualItem,
} from '../../hooks/useVirtualList';

export {
  useInfiniteLoad,
  type UseInfiniteLoadOptions,
  type UseInfiniteLoadResult,
} from '../../hooks/useInfiniteLoad';

export {
  useAutoCleanup,
  type UseAutoCleanupOptions,
} from '../../hooks/useAutoCleanup';

export {
  useSyncStatus,
  type SyncState,
  type SyncSummary,
  type UseSyncStatusResult,
} from '../../hooks/useSyncStatus';

export {
  useConflicts,
  type ConflictItem,
  type UseConflictsResult,
} from '../../hooks/useConflicts';
