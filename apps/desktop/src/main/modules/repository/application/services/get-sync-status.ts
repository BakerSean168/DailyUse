import { createLogger } from '@dailyuse/utils';

export interface SyncStatus {
  status: 'offline' | 'syncing' | 'synced' | 'error';
  lastSync: Date | null;
  pendingChanges: number;
  error?: string;
}

const logger = createLogger('getSyncStatusService');

export async function getSyncStatusService(): Promise<SyncStatus> {
  logger.debug('Get sync status');
  return {
    status: 'offline',
    lastSync: null,
    pendingChanges: 0,
  };
}
