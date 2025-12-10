import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getExportFormatsService');

export async function getExportFormatsService(): Promise<{ formats: string[] }> {
  return { formats: ['json', 'csv'] };
}
