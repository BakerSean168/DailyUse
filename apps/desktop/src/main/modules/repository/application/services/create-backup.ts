import * as path from 'path';
import * as fs from 'fs/promises';
import { app } from 'electron';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('createBackupService');

export interface BackupInfo {
  uuid: string;
  name: string;
  path: string;
  size: number;
  createdAt: Date;
  description?: string;
}

export interface BackupOptions {
  name?: string;
  description?: string;
  includeSettings?: boolean;
}

export async function createBackupService(
  options: BackupOptions = {},
): Promise<{ success: boolean; backup?: BackupInfo; error?: string }> {
  logger.debug('Create backup', options);

  try {
    const backupDir = path.join(app.getPath('userData'), 'backups');
    await fs.mkdir(backupDir, { recursive: true });

    const backupId = `backup-${Date.now()}`;
    const backupName = options.name || `Backup ${new Date().toISOString().split('T')[0]}`;
    const backupPath = path.join(backupDir, `${backupId}.json`);

    const backupData = {
      metadata: {
        uuid: backupId,
        name: backupName,
        description: options.description,
        createdAt: new Date().toISOString(),
        version: '1.0.0',
      },
      data: {
        goals: [],
        tasks: [],
        schedules: [],
        reminders: [],
        settings: options.includeSettings ? {} : undefined,
      },
    };

    await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2), 'utf-8');

    const stats = await fs.stat(backupPath);

    const backup: BackupInfo = {
      uuid: backupId,
      name: backupName,
      path: backupPath,
      size: stats.size,
      createdAt: new Date(),
      description: options.description,
    };

    logger.info('Backup created successfully', { backupId });
    return { success: true, backup };
  } catch (error) {
    logger.error('Failed to create backup', error);
    return { success: false, error: String(error) };
  }
}
