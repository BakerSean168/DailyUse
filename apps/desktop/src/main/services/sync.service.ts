/**
 * Sync Manager Service
 *
 * Manages synchronization of data between local database and remote server.
 * This is a stub implementation for now.
 */

import type { Database } from 'better-sqlite3';

interface SyncManager {
  getSyncSummary(): any;
  getStats(): any;
  getSyncLogService(): {
    getPendingCount(): number;
  };
  getSyncStateService(): {
    getState(): any;
  };
  triggerSync(): void;
  forceSync(): Promise<any>;
  isOnline(): boolean;
  getConflictManager(): {
    getUnresolvedConflicts(entityType: string): any[];
    getUnresolvedCount(entityType: string): number;
    resolveManually(conflictId: string, fieldSelections: any): Promise<any>;
    resolveWithLocal(conflictId: string): Promise<any>;
    resolveWithServer(conflictId: string): Promise<any>;
    queryHistory(filter: any, pagination: any): Promise<any>;
    getStats(): any;
  };
  getDeviceService(): {
    getDeviceInfo(): any;
    updateDeviceName(newName: string): void;
  };
}

let syncManagerInstance: SyncManager | null = null;

/**
 * Initialize sync manager with database connection
 */
export function initSyncManager(db: Database): void {
  console.log('[SyncManager] Initializing sync manager');
  
  if (!syncManagerInstance) {
    syncManagerInstance = createSyncManager(db);
  }
}

/**
 * Get the sync manager instance
 */
export function getSyncManager(): SyncManager {
  if (!syncManagerInstance) {
    throw new Error('SyncManager not initialized. Call initSyncManager() first.');
  }
  return syncManagerInstance;
}

/**
 * Create a stub sync manager instance
 */
function createSyncManager(db: Database): SyncManager {
  const syncLogService = {
    getPendingCount(): number {
      return 0;
    },
  };

  const syncStateService = {
    getState(): any {
      return {
        status: 'idle',
        lastSyncTime: null,
        isSyncing: false,
      };
    },
  };

  const conflictManager = {
    getUnresolvedConflicts(entityType: string): any[] {
      return [];
    },
    getUnresolvedCount(entityType: string): number {
      return 0;
    },
    async resolveManually(conflictId: string, fieldSelections: any): Promise<any> {
      return { success: true };
    },
    async resolveWithLocal(conflictId: string): Promise<any> {
      return { success: true };
    },
    async resolveWithServer(conflictId: string): Promise<any> {
      return { success: true };
    },
    async queryHistory(filter: any, pagination: any): Promise<any> {
      return { items: [], total: 0 };
    },
    getStats(): any {
      return {
        totalConflicts: 0,
        resolvedCount: 0,
        unresolvedCount: 0,
      };
    },
  };

  const deviceService = {
    getDeviceInfo(): any {
      return {
        deviceId: 'default-device',
        deviceName: 'Desktop',
        lastSeen: new Date().toISOString(),
      };
    },
    updateDeviceName(newName: string): void {
      console.log(`[SyncManager] Device name updated to: ${newName}`);
    },
  };

  return {
    getSyncSummary(): any {
      return {
        status: 'idle',
        lastSync: null,
        pendingChanges: 0,
      };
    },
    getStats(): any {
      return {
        syncedEntities: 0,
        pendingChanges: 0,
        lastSyncTime: null,
        conflicts: 0,
      };
    },
    getSyncLogService(): typeof syncLogService {
      return syncLogService;
    },
    getSyncStateService(): typeof syncStateService {
      return syncStateService;
    },
    triggerSync(): void {
      console.log('[SyncManager] Sync triggered');
    },
    async forceSync(): Promise<any> {
      console.log('[SyncManager] Force sync initiated');
      return { success: true, syncedCount: 0 };
    },
    isOnline(): boolean {
      return true;
    },
    getConflictManager(): typeof conflictManager {
      return conflictManager;
    },
    getDeviceService(): typeof deviceService {
      return deviceService;
    },
  };
}
