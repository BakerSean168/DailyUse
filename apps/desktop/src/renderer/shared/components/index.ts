/**
 * Shared Components - 统一导出
 *
 * 从原 components/ 目录迁移的共享组件
 */

// 重新导出原有组件
export { Layout } from '../../components/Layout';
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
} from '../../components/Skeleton';
export {
  VirtualList,
  VirtualGroupedList,
  type VirtualListProps,
  type VirtualGroupedListProps,
} from '../../components/VirtualList';

// EPIC-003: Performance Optimization Components
export { LazyImage, type LazyImageProps } from '../../components/LazyImage';

// EPIC-004: Sync UI Components
export { SyncStatusIndicator } from '../../components/SyncStatusIndicator';
export { ConflictResolverDialog } from '../../components/ConflictResolverDialog';
export { SyncConfigWizard } from '../../components/SyncConfigWizard';
