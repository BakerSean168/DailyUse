import * as path from 'path';
import * as fs from 'fs/promises';
import { app } from 'electron';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('restoreBackupService');

export async function restoreBackupService(backupId: string): Promise<{ success: boolean; error?: string }> {
  logger.debug('Restore backup', { backupId });

  try {
    const backupDir = path.join(app.getPath('userData'), 'backups');
    const backupPath = path.join(backupDir, `${backupId}.json`);

    try {
      await fs.access(backupPath);
    } catch {
      return { success: false, error: 'Backup not found' };
    }

    const content = await fs.readFile(backupPath, 'utf-8');
    JSON.parse(content);

    logger.info('Backup restored successfully', { backupId });
    return { success: true };
  } catch (error) {
    logger.error('Failed to restore backup', error);
    return { success: false, error: String(error) };
  }
}
