/**
 * Shared UI Components
 *
 * Exports all reusable UI components available for the renderer process.
 * Includes layouts, skeletons for loading states, virtual lists, performance optimizations, and sync-related UI.
 *
 * @module renderer/shared/components
 */

export { Layout } from './Layout';
export {
  Skeleton,
  DashboardSkeleton,
  StatCardSkeleton,
  GoalCardSkeleton,
  GoalListSkeleton,
  TaskCardSkeleton,
  TaskListSkeleton,
  ScheduleItemSkeleton,
  ReminderItemSkeleton,
  ListItemSkeleton,
  TableSkeleton,
} from './Skeleton';
export { VirtualList, VirtualGroupedList, type VirtualListProps, type VirtualGroupedListProps } from './VirtualList';

// EPIC-003: Performance Optimization Components
export {
  LazyImage,
  type LazyImageProps,
} from './LazyImage';

// EPIC-004: Sync UI Components
export { SyncStatusIndicator } from './SyncStatusIndicator';
export { ConflictResolverDialog } from './ConflictResolverDialog';
export { SyncConfigWizard } from './SyncConfigWizard';
