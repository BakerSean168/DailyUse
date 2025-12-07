/**
 * Desktop Renderer Hooks
 *
 * Exports all custom hooks for the desktop renderer
 */

export { useAuth } from './useAuth';
export { useAccount } from './useAccount';
export { useAI } from './useAI';
export { useAISettings } from './useAISettings';
export { useNotification } from './useNotification';
export { useRepository } from './useRepository';
export { useAppSettings, type ShortcutConfig, type AppSettings } from './useAppSettings';
export { useVirtualList, type VirtualListOptions, type VirtualListResult, type VirtualItem } from './useVirtualList';
export { useDashboard, type DashboardStats, type DashboardData, type UseDashboardOptions, type UseDashboardResult } from './useDashboard';

// EPIC-003: Performance Optimization Hooks
export {
  useInfiniteLoad,
  type UseInfiniteLoadOptions,
  type UseInfiniteLoadResult,
  type InfiniteLoadState,
} from './useInfiniteLoad';
export {
  useAutoCleanup,
  useCleanupOnUnmount,
  useDelayedCleanup,
  useMemoryManager,
  MemoryManagerProvider,
  type AutoCleanupOptions,
  type MemoryManager,
} from './useAutoCleanup';
