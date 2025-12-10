import * as path from 'path';
import * as fs from 'fs/promises';
import { app } from 'electron';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('startSyncService');

export async function startSyncService(): Promise<{ success: boolean; error?: string }> {
  logger.debug('Start sync requested');
  return { success: false, error: 'Desktop offline mode - sync not available' };
}
