import { createLogger } from '@dailyuse/utils';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  summary?: {
    goals?: number;
    tasks?: number;
    schedules?: number;
    reminders?: number;
  };
}

const logger = createLogger('validateImportDataService');

export async function validateImportDataService(
  data: string,
  format: 'json' | 'csv',
): Promise<ValidationResult> {
  logger.debug('Validate import data', { format });

  try {
    if (format === 'json') {
      const parsed = JSON.parse(data);

      if (typeof parsed !== 'object') {
        return { valid: false, errors: ['Invalid JSON structure'], warnings: [] };
      }

      return {
        valid: true,
        errors: [],
        warnings: [],
        summary: {
          goals: parsed.data?.goals?.length || 0,
          tasks: parsed.data?.tasks?.length || 0,
          schedules: parsed.data?.schedules?.length || 0,
          reminders: parsed.data?.reminders?.length || 0,
        },
      };
    } else {
      const lines = data.split('\n').filter((l) => l.trim());
      if (lines.length < 2) {
        return { valid: false, errors: ['CSV must have header and at least one data row'], warnings: [] };
      }

      return {
        valid: true,
        errors: [],
        warnings: ['CSV import has limited support'],
        summary: {
          goals: lines.length - 1,
        },
      };
    }
  } catch (error) {
    return { valid: false, errors: [`Parse error: ${error}`], warnings: [] };
  }
}
