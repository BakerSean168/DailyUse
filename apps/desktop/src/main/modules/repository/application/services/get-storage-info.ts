import * as path from 'path';
import { app } from 'electron';
import { listBackupsService } from './list-backups';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getStorageInfoService');

export async function getStorageInfoService(): Promise<{
  backupSize: number;
  backupCount: number;
  databaseSize: number;
  totalSize: number;
}> {
  logger.debug('Get storage info');

  try {
    const { backups, total } = await listBackupsService();
    const backupSize = backups.reduce((sum, b) => sum + b.size, 0);

    const databaseSize = 0;

    return {
      backupSize,
      backupCount: total,
      databaseSize,
      totalSize: backupSize + databaseSize,
    };
  } catch (error) {
    logger.error('Failed to get storage info', error);
    return {
      backupSize: 0,
      backupCount: 0,
      databaseSize: 0,
      totalSize: 0,
    };
  }
}
