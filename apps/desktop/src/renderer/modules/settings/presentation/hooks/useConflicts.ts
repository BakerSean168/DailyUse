/**
 * useConflicts Hook
 * 
 * EPIC-004: Offline Sync - STORY-022 UI 集成
 * 
 * 冲突管理 Hook
 * 
 * TODO: 实现实际的冲突管理逻辑
 */

export interface ConflictRecord {
  id: string;
  entityType: string;
  entityId: string;
  localData: unknown;
  serverData: unknown;
  createdAt: number;
  conflictingFields: string[];
}

export interface MergeResult {
  conflictId: string;
  resolution: 'local' | 'server' | 'manual';
  mergedData?: unknown;
}

export interface UseConflictsReturn {
  conflicts: ConflictRecord[];
  resolveWithLocal: (conflictId: string) => Promise<void>;
  resolveWithServer: (conflictId: string) => Promise<void>;
  resolveManually: (conflictId: string, mergedData: unknown) => Promise<void>;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

/**
 * 冲突管理 Hook
 * 
 * 提供冲突列表查询、冲突解决等功能
 */
export function useConflicts(): UseConflictsReturn {
  // TODO: 实现实际的冲突管理逻辑
  return {
    conflicts: [],
    resolveWithLocal: async (conflictId: string) => {
      console.log('[useConflicts] resolveWithLocal not implemented', conflictId);
    },
    resolveWithServer: async (conflictId: string) => {
      console.log('[useConflicts] resolveWithServer not implemented', conflictId);
    },
    resolveManually: async (conflictId: string, mergedData: unknown) => {
      console.log('[useConflicts] resolveManually not implemented', conflictId, mergedData);
    },
    isLoading: false,
    refresh: async () => {
      console.log('[useConflicts] refresh not implemented');
    },
  };
}

export default useConflicts;
