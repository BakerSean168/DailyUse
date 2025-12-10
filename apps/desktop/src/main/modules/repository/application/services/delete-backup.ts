import * as path from 'path';
import * as fs from 'fs/promises';
import { app } from 'electron';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('deleteBackupService');

export async function deleteBackupService(backupId: string): Promise<{ success: boolean; error?: string }> {
  logger.debug('Delete backup', { backupId });

  try {
    const backupDir = path.join(app.getPath('userData'), 'backups');
    const backupPath = path.join(backupDir, `${backupId}.json`);
    await fs.unlink(backupPath);

    logger.info('Backup deleted', { backupId });
    return { success: true };
  } catch (error) {
    logger.error('Failed to delete backup', error);
    return { success: false, error: String(error) };
  }
}
