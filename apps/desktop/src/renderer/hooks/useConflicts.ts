/**
 * Conflict Management Hook
 * 
 * EPIC-004: Offline Sync - STORY-022 UI 集成
 * 
 * 提供冲突记录的管理功能
 */

import { useState, useEffect, useCallback } from 'react';

// 字段差异
export interface FieldDiff {
  field: string;
  localValue: unknown;
  serverValue: unknown;
}

// 冲突记录
export interface ConflictRecord {
  id: string;
  entityType: string;
  entityId: string;
  localData: Record<string, unknown>;
  serverData: Record<string, unknown>;
  conflictingFields: FieldDiff[];
  resolution?: string;
  resolvedData?: Record<string, unknown>;
  resolvedAt?: number;
  resolvedBy?: string;
  createdAt: number;
}

// 分页结果
export interface PaginatedConflicts {
  items: ConflictRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 冲突统计
export interface ConflictStats {
  total: number;
  unresolved: number;
  resolved: number;
  byEntityType: Record<string, { total: number; unresolved: number }>;
  byResolution: Record<string, number>;
  averageResolutionTime: number;
}

// 合并结果
export interface MergeResult {
  success: boolean;
  strategy: string;
  mergedData: Record<string, unknown>;
  manualFields?: string[];
}

// Hook 返回类型
export interface UseConflictsResult {
  // 数据
  conflicts: ConflictRecord[];
  unresolvedCount: number;
  stats: ConflictStats | null;
  
  // 操作
  resolveWithLocal: (conflictId: string) => Promise<MergeResult | null>;
  resolveWithServer: (conflictId: string) => Promise<MergeResult | null>;
  resolveManually: (conflictId: string, selections: Record<string, 'local' | 'server'>) => Promise<MergeResult | null>;
  
  // 状态
  isLoading: boolean;
  error: Error | null;
  
  // 刷新
  refresh: () => Promise<void>;
}

export function useConflicts(entityType?: string): UseConflictsResult {
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([]);
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  const [stats, setStats] = useState<ConflictStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 获取冲突列表
  const fetchConflicts = useCallback(async () => {
    try {
      setIsLoading(true);
      const [conflictsResult, countResult, statsResult] = await Promise.all([
        window.electronAPI.invoke<ConflictRecord[]>('sync:conflict:getUnresolved', entityType),
        window.electronAPI.invoke<number>('sync:conflict:getCount', entityType),
        window.electronAPI.invoke<ConflictStats | null>('sync:conflict:getStats'),
      ]);

      setConflicts(conflictsResult ?? []);
      setUnresolvedCount(countResult ?? 0);
      setStats(statsResult);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to fetch conflicts'));
    } finally {
      setIsLoading(false);
    }
  }, [entityType]);

  // 使用本地版本解决
  const resolveWithLocal = useCallback(async (conflictId: string): Promise<MergeResult | null> => {
    try {
      const result = await window.electronAPI.invoke<MergeResult>('sync:conflict:resolveWithLocal', conflictId);
      await fetchConflicts();
      return result;
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to resolve conflict'));
      return null;
    }
  }, [fetchConflicts]);

  // 使用服务器版本解决
  const resolveWithServer = useCallback(async (conflictId: string): Promise<MergeResult | null> => {
    try {
      const result = await window.electronAPI.invoke<MergeResult>('sync:conflict:resolveWithServer', conflictId);
      await fetchConflicts();
      return result;
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to resolve conflict'));
      return null;
    }
  }, [fetchConflicts]);

  // 手动选择解决
  const resolveManually = useCallback(async (
    conflictId: string,
    selections: Record<string, 'local' | 'server'>
  ): Promise<MergeResult | null> => {
    try {
      const result = await window.electronAPI.invoke<MergeResult>('sync:conflict:resolve', conflictId, selections);
      await fetchConflicts();
      return result;
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to resolve conflict'));
      return null;
    }
  }, [fetchConflicts]);

  // 初始加载
  useEffect(() => {
    fetchConflicts();
  }, [fetchConflicts]);

  return {
    conflicts,
    unresolvedCount,
    stats,
    resolveWithLocal,
    resolveWithServer,
    resolveManually,
    isLoading,
    error,
    refresh: fetchConflicts,
  };
}
