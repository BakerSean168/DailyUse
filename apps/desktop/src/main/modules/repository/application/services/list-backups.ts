import * as path from 'path';
import * as fs from 'fs/promises';
import { app } from 'electron';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('listBackupsService');

export interface BackupInfo {
  uuid: string;
  name: string;
  path: string;
  size: number;
  createdAt: Date;
  description?: string;
}

export async function listBackupsService(): Promise<{ backups: BackupInfo[]; total: number }> {
  logger.debug('List backups');

  try {
    const backupDir = path.join(app.getPath('userData'), 'backups');
    const files = await fs.readdir(backupDir);
    const backups: BackupInfo[] = [];

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const filePath = path.join(backupDir, file);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(content);
        const stats = await fs.stat(filePath);

        backups.push({
          uuid: data.metadata?.uuid || file.replace('.json', ''),
          name: data.metadata?.name || file,
          path: filePath,
          size: stats.size,
          createdAt: new Date(data.metadata?.createdAt || stats.birthtime),
          description: data.metadata?.description,
        });
      } catch {
        // Skip invalid files
      }
    }

    backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return { backups, total: backups.length };
  } catch (error) {
    logger.error('Failed to list backups', error);
    return { backups: [], total: 0 };
  }
}
