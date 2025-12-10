import * as path from 'path';
import * as fs from 'fs/promises';
import { app } from 'electron';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getBackupService');

export interface BackupInfo {
  uuid: string;
  name: string;
  path: string;
  size: number;
  createdAt: Date;
  description?: string;
}

export async function getBackupService(backupId: string): Promise<BackupInfo | null> {
  logger.debug('Get backup', { backupId });

  try {
    const backupDir = path.join(app.getPath('userData'), 'backups');
    const backupPath = path.join(backupDir, `${backupId}.json`);
    const content = await fs.readFile(backupPath, 'utf-8');
    const data = JSON.parse(content);
    const stats = await fs.stat(backupPath);

    return {
      uuid: data.metadata?.uuid || backupId,
      name: data.metadata?.name || backupId,
      path: backupPath,
      size: stats.size,
      createdAt: new Date(data.metadata?.createdAt || stats.birthtime),
      description: data.metadata?.description,
    };
  } catch (error) {
    logger.error('Failed to get backup', error);
    return null;
  }
}
