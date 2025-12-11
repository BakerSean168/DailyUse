/**
 * Conflict Management Hook
 * 
 * Provides an interface to access and resolve data conflicts detected during synchronization.
 * Supports retrieving conflict lists, statistics, and applying resolution strategies.
 * 
 * Part of EPIC-004: Offline Sync - STORY-022 UI Integration.
 *
 * @module renderer/shared/hooks/useConflicts
 */

import { useState, useEffect, useCallback } from 'react';

/** Represents a difference in a single field between local and remote versions. */
export interface FieldDiff {
  field: string;
  localValue: unknown;
  serverValue: unknown;
}

/** Represents a full conflict record for an entity. */
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

/** Paginated list of conflict records. */
export interface PaginatedConflicts {
  items: ConflictRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Statistical summary of conflicts. */
export interface ConflictStats {
  total: number;
  unresolved: number;
  resolved: number;
  byEntityType: Record<string, { total: number; unresolved: number }>;
  byResolution: Record<string, number>;
  averageResolutionTime: number;
}

/** Result of a conflict resolution operation. */
export interface MergeResult {
  success: boolean;
  strategy: string;
  mergedData: Record<string, unknown>;
  manualFields?: string[];
}

/** Result object returned by the useConflicts hook. */
export interface UseConflictsResult {
  // --- Data ---
  /** List of unresolved conflict records. */
  conflicts: ConflictRecord[];
  /** Total count of unresolved conflicts. */
  unresolvedCount: number;
  /** Detailed conflict statistics. */
  stats: ConflictStats | null;
  
  // --- Actions ---
  /** Resolve a conflict by accepting the local version. */
  resolveWithLocal: (conflictId: string) => Promise<MergeResult | null>;
  /** Resolve a conflict by accepting the server version. */
  resolveWithServer: (conflictId: string) => Promise<MergeResult | null>;
  /** Resolve a conflict by manually selecting field values. */
  resolveManually: (conflictId: string, selections: Record<string, 'local' | 'server'>) => Promise<MergeResult | null>;
  
  // --- State ---
  /** Whether data is being fetched. */
  isLoading: boolean;
  /** Last error encountered. */
  error: Error | null;
  
  /** Manually refresh the conflict list. */
  refresh: () => Promise<void>;
}

/**
 * Hook to manage data synchronization conflicts.
 *
 * @param {string} [entityType] - Optional filter to retrieve conflicts only for a specific entity type.
 * @returns {UseConflictsResult} The conflict data and management functions.
 */
export function useConflicts(entityType?: string): UseConflictsResult {
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([]);
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  const [stats, setStats] = useState<ConflictStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetches the current list of unresolved conflicts and statistics.
   */
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

  /**
   * Resolves a conflict using the local version strategy.
   */
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

  /**
   * Resolves a conflict using the server version strategy.
   */
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

  /**
   * Resolves a conflict using manual field selection strategy.
   */
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

  // Initial load
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
