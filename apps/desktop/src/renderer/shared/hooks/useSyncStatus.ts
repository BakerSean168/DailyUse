/**
 * Sync Status Hook
 * 
 * Provides reactive access to the application's synchronization state.
 * Allows components to monitor online status, pending changes, and conflicts,
 * as well as triggering sync actions.
 * 
 * Part of EPIC-004: Offline Sync - STORY-022 UI Integration.
 *
 * @module renderer/shared/hooks/useSyncStatus
 */

import { useState, useEffect, useCallback } from 'react';

/** Possible states for the sync process. */
export type SyncState = 'idle' | 'syncing' | 'error' | 'offline';

/**
 * Summary of the current synchronization status.
 */
export interface SyncSummary {
  /** Unique ID of the current device. */
  deviceId: string;
  /** Human-readable name of the current device. */
  deviceName: string;
  /** Platform identifier (e.g., 'win32', 'darwin'). */
  platform: string;
  /** Number of local changes waiting to be synced. */
  pendingCount: number;
  /** Current operational state. */
  syncState: SyncState;
  /** Timestamp of the last successful sync. */
  lastSyncAt: number | null;
  /** Error message from the last failed sync attempt. */
  lastError: string | null;
  /** Number of unresolved data conflicts. */
  unresolvedConflicts: number;
}

/**
 * Detailed statistics about synchronization activities.
 */
export interface SyncStats {
  /** Total number of changes processed. */
  totalChanges: number;
  /** Number of changes currently pending. */
  pendingChanges: number;
  /** Number of successfully synced changes. */
  syncedChanges: number;
  /** Number of failed change attempts. */
  failedChanges: number;
  /** Number of conflicts detected. */
  conflictChanges: number;
}

/**
 * Result returned by useSyncStatus hook.
 */
export interface UseSyncStatusResult {
  // --- Status ---
  /** Current sync state (idle, syncing, error, offline). */
  status: SyncState;
  /** Number of items pending synchronization. */
  pendingCount: number;
  /** Timestamp of the last sync. */
  lastSyncAt: number | null;
  /** Last error message, if any. */
  lastError: string | null;
  /** Count of unresolved conflicts. */
  unresolvedConflicts: number;
  /** Whether the application considers itself online. */
  isOnline: boolean;
  
  // --- Device Info ---
  /** Current device ID. */
  deviceId: string;
  /** Current device name. */
  deviceName: string;
  
  // --- Statistics ---
  /** Detailed sync statistics. */
  stats: SyncStats | null;
  
  // --- Actions ---
  /** Trigger a standard sync operation. */
  triggerSync: () => Promise<void>;
  /** Force a full synchronization. */
  forceSync: () => Promise<void>;
  
  // --- Hook State ---
  /** Whether the status is currently being fetched. */
  isLoading: boolean;
  /** Error encountered while fetching status. */
  error: Error | null;
  
  /** Manually refresh the status from the main process. */
  refresh: () => Promise<void>;
}

const DEFAULT_SUMMARY: SyncSummary = {
  deviceId: '',
  deviceName: 'Unknown',
  platform: 'unknown',
  pendingCount: 0,
  syncState: 'offline',
  lastSyncAt: null,
  lastError: null,
  unresolvedConflicts: 0,
};

/**
 * Hook to access and control synchronization status.
 * Polls the main process periodically for updates.
 *
 * @returns {UseSyncStatusResult} The current sync status and control methods.
 */
export function useSyncStatus(): UseSyncStatusResult {
  const [summary, setSummary] = useState<SyncSummary>(DEFAULT_SUMMARY);
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetches the latest sync status from the main process via IPC.
   */
  const fetchStatus = useCallback(async () => {
    try {
      const [summaryResult, statsResult, onlineResult] = await Promise.all([
        window.electronAPI.invoke<SyncSummary | null>('sync:getSummary'),
        window.electronAPI.invoke<SyncStats | null>('sync:getStats'),
        window.electronAPI.invoke<boolean>('sync:isOnline'),
      ]);

      if (summaryResult) {
        setSummary(summaryResult);
      }
      if (statsResult) {
        setStats(statsResult);
      }
      setIsOnline(onlineResult);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to fetch sync status'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Triggers a sync operation.
   */
  const triggerSync = useCallback(async () => {
    try {
      await window.electronAPI.invoke('sync:triggerSync');
      // Refresh status shortly after to reflect changes
      setTimeout(fetchStatus, 500);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to trigger sync'));
    }
  }, [fetchStatus]);

  /**
   * Forces a sync operation (bypassing some checks).
   */
  const forceSync = useCallback(async () => {
    try {
      await window.electronAPI.invoke('sync:forceSync');
      await fetchStatus();
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to force sync'));
    }
  }, [fetchStatus]);

  // Initial load and periodic polling
  useEffect(() => {
    fetchStatus();
    
    // Poll every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return {
    // Status
    status: summary.syncState,
    pendingCount: summary.pendingCount,
    lastSyncAt: summary.lastSyncAt,
    lastError: summary.lastError,
    unresolvedConflicts: summary.unresolvedConflicts,
    isOnline,
    
    // Device Info
    deviceId: summary.deviceId,
    deviceName: summary.deviceName,
    
    // Statistics
    stats,
    
    // Actions
    triggerSync,
    forceSync,
    
    // Hook State
    isLoading,
    error,
    
    // Helpers
    refresh: fetchStatus,
  };
}
