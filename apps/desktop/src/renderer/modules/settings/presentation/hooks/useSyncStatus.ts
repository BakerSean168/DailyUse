/**
 * useSyncStatus Hook
 * 
 * EPIC-004: Offline Sync - STORY-022 UI 集成
 * 
 * 同步状态管理 Hook
 * 
 * TODO: 实现实际的同步状态逻辑
 */

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

export interface SyncStats {
  totalSynced: number;
  totalConflicts: number;
  lastSuccessfulSync: number | null;
  totalChanges: number;
  syncedChanges: number;
  pendingChanges: number;
  failedChanges: number;
}

export interface UseSyncStatusReturn {
  status: SyncStatus;
  pendingCount: number;
  lastSyncAt: number | null;
  lastError: string | null;
  unresolvedConflicts: number;
  isOnline: boolean;
  deviceId: string;
  deviceName: string;
  stats: SyncStats;
  triggerSync: () => Promise<void>;
  forceSync: () => Promise<void>;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

/**
 * 同步状态管理 Hook
 * 
 * 提供同步状态查询、触发同步等功能
 */
export function useSyncStatus(): UseSyncStatusReturn {
  // TODO: 实现实际的同步状态逻辑
  return {
    status: 'idle',
    pendingCount: 0,
    lastSyncAt: null,
    lastError: null,
    unresolvedConflicts: 0,
    isOnline: true,
    deviceId: 'local-device',
    deviceName: 'Desktop',
    stats: {
      totalSynced: 0,
      totalConflicts: 0,
      lastSuccessfulSync: null,
      totalChanges: 0,
      syncedChanges: 0,
      pendingChanges: 0,
      failedChanges: 0,
    },
    triggerSync: async () => {
      console.log('[useSyncStatus] triggerSync not implemented');
    },
    forceSync: async () => {
      console.log('[useSyncStatus] forceSync not implemented');
    },
    isLoading: false,
    refresh: async () => {
      console.log('[useSyncStatus] refresh not implemented');
    },
  };
}

export default useSyncStatus;
