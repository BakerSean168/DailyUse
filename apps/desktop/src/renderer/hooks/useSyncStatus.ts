/**
 * Sync Status Hook
 * 
 * EPIC-004: Offline Sync - STORY-022 UI 集成
 * 
 * 提供同步状态的响应式访问
 */

import { useState, useEffect, useCallback } from 'react';

// 同步状态类型
export type SyncState = 'idle' | 'syncing' | 'error' | 'offline';

// 同步摘要信息
export interface SyncSummary {
  deviceId: string;
  deviceName: string;
  platform: string;
  pendingCount: number;
  syncState: SyncState;
  lastSyncAt: number | null;
  lastError: string | null;
  unresolvedConflicts: number;
}

// 同步统计信息
export interface SyncStats {
  totalChanges: number;
  pendingChanges: number;
  syncedChanges: number;
  failedChanges: number;
  conflictChanges: number;
}

// Hook 返回类型
export interface UseSyncStatusResult {
  // 状态
  status: SyncState;
  pendingCount: number;
  lastSyncAt: number | null;
  lastError: string | null;
  unresolvedConflicts: number;
  isOnline: boolean;
  
  // 设备信息
  deviceId: string;
  deviceName: string;
  
  // 统计
  stats: SyncStats | null;
  
  // 操作
  triggerSync: () => Promise<void>;
  forceSync: () => Promise<void>;
  
  // 状态
  isLoading: boolean;
  error: Error | null;
  
  // 刷新
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

export function useSyncStatus(): UseSyncStatusResult {
  const [summary, setSummary] = useState<SyncSummary>(DEFAULT_SUMMARY);
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 获取同步状态
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

  // 触发同步
  const triggerSync = useCallback(async () => {
    try {
      await window.electronAPI.invoke('sync:triggerSync');
      // 稍后刷新状态
      setTimeout(fetchStatus, 500);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to trigger sync'));
    }
  }, [fetchStatus]);

  // 强制同步
  const forceSync = useCallback(async () => {
    try {
      await window.electronAPI.invoke('sync:forceSync');
      await fetchStatus();
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to force sync'));
    }
  }, [fetchStatus]);

  // 初始加载和定期刷新
  useEffect(() => {
    fetchStatus();
    
    // 每 30 秒刷新一次
    const interval = setInterval(fetchStatus, 30000);
    
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return {
    // 状态
    status: summary.syncState,
    pendingCount: summary.pendingCount,
    lastSyncAt: summary.lastSyncAt,
    lastError: summary.lastError,
    unresolvedConflicts: summary.unresolvedConflicts,
    isOnline,
    
    // 设备信息
    deviceId: summary.deviceId,
    deviceName: summary.deviceName,
    
    // 统计
    stats,
    
    // 操作
    triggerSync,
    forceSync,
    
    // 状态
    isLoading,
    error,
    
    // 刷新
    refresh: fetchStatus,
  };
}
