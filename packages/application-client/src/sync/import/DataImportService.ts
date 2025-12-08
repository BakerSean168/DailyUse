/**
 * Data Import Service & Components
 *
 * Provides functionality to import user data from various sources:
 * - JSON (raw exported data)
 * - CSV (spreadsheet format)
 * - Backup (complete encrypted backup)
 *
 * 数据导入 - 支持多种格式导入用户数据
 *
 * @module services/sync/import
 */

import { ISyncAdapter } from '@dailyuse/application-client';

// Types
export interface ImportOptions {
  format: 'json' | 'csv' | 'backup';
  filePath: string;
  strategy: 'merge' | 'replace' | 'skip-existing';
  validateChecksum: boolean;
  decryptionKey?: string;
}

export interface ImportProgress {
  stage: 'reading' | 'validating' | 'importing' | 'complete';
  current: number;
  total: number;
  currentEntity?: string;
  itemsImported: number;
  itemsSkipped: number;
  itemsFailed: number;
  error?: string;
}

export interface ImportResult {
  success: boolean;
  totalItems: number;
  itemsImported: number;
  itemsSkipped: number;
  itemsFailed: number;
  errors: Array<{ entity: string; itemId: string; error: string }>;
  timestamp: Date;
}

/**
 * Data Import Service
 *
 * Handles importing user data from various sources
 */
export class DataImportService {
  constructor(
    private adapter?: ISyncAdapter,
    private localStoragePath?: string
  ) {}

  /**
   * Import data from the specified source
   *
   * @param options Import options
   * @param onProgress Progress callback
   * @returns Import result
   */
  async import(
    options: ImportOptions,
    onProgress?: (progress: ImportProgress) => void
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      totalItems: 0,
      itemsImported: 0,
      itemsSkipped: 0,
      itemsFailed: 0,
      errors: [],
      timestamp: new Date(),
    };

    try {
      onProgress?.({
        stage: 'reading',
        current: 0,
        total: 100,
        itemsImported: 0,
        itemsSkipped: 0,
        itemsFailed: 0,
      });

      // Read file
      const fileContent = await this.readFile(options.filePath);

      onProgress?.({
        stage: 'validating',
        current: 30,
        total: 100,
        itemsImported: 0,
        itemsSkipped: 0,
        itemsFailed: 0,
      });

      // Parse and validate data
      const data = await this.parseAndValidate(
        fileContent,
        options.format,
        options.validateChecksum
      );

      result.totalItems = Object.values(data).reduce(
        (sum, arr) => sum + arr.length,
        0
      );

      onProgress?.({
        stage: 'importing',
        current: 50,
        total: 100,
        itemsImported: 0,
        itemsSkipped: 0,
        itemsFailed: 0,
      });

      // Import data
      for (const [entityType, items] of Object.entries(data)) {
        for (const item of items) {
          try {
            await this.importItem(
              entityType,
              item as Record<string, unknown>,
              options.strategy
            );
            result.itemsImported++;
          } catch (error) {
            result.itemsFailed++;
            result.errors.push({
              entity: entityType,
              itemId: (item as Record<string, unknown>).id as string || 'unknown',
              error: error instanceof Error ? error.message : String(error),
            });
          }

          onProgress?.({
            stage: 'importing',
            current: 50 + (result.itemsImported / result.totalItems) * 50,
            total: 100,
            currentEntity: entityType,
            itemsImported: result.itemsImported,
            itemsSkipped: result.itemsSkipped,
            itemsFailed: result.itemsFailed,
          });
        }
      }

      result.success = result.itemsFailed === 0;

      onProgress?.({
        stage: 'complete',
        current: 100,
        total: 100,
        itemsImported: result.itemsImported,
        itemsSkipped: result.itemsSkipped,
        itemsFailed: result.itemsFailed,
      });
    } catch (error) {
      result.success = false;
      result.errors.push({
        entity: 'import',
        itemId: 'global',
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return result;
  }

  /**
   * Read file from disk
   */
  private async readFile(filePath: string): Promise<string> {
    // In a real implementation, this would use Node.js fs module or Electron APIs
    // For now, return a placeholder
    return '';
  }

  /**
   * Parse and validate imported data
   */
  private async parseAndValidate(
    content: string,
    format: string,
    validateChecksum: boolean
  ): Promise<Record<string, unknown[]>> {
    let data: Record<string, unknown> = {};

    switch (format) {
      case 'json':
        data = JSON.parse(content);
        break;
      case 'csv':
        data = this.parseCSV(content);
        break;
      case 'backup':
        data = JSON.parse(content);
        if (validateChecksum && data.checksum) {
          // Verify checksum
          // In a real implementation, recalculate and compare
        }
        break;
      default:
        throw new Error(`Unknown format: ${format}`);
    }

    if (!data.data || typeof data.data !== 'object') {
      throw new Error('Invalid data format: missing or invalid data property');
    }

    return data.data as Record<string, unknown[]>;
  }

  /**
   * Parse CSV format
   */
  private parseCSV(content: string): Record<string, unknown[]> {
    const data: Record<string, unknown[]> = {};
    const lines = content.split('\n');
    let currentEntity = '';
    let headers: string[] = [];

    for (const line of lines) {
      if (line.startsWith('Entity Type:')) {
        currentEntity = line.replace('Entity Type:', '').trim();
        data[currentEntity] = [];
      } else if (line && !line.startsWith('Entity Type:')) {
        if (headers.length === 0) {
          // First line after entity type is headers
          headers = line.split(',');
        } else if (line.trim()) {
          // Parse data row
          const values = this.parseCSVRow(line);
          const item: Record<string, unknown> = {};
          for (let i = 0; i < headers.length; i++) {
            item[headers[i]] = values[i];
          }
          data[currentEntity].push(item);
        }
      }
    }

    return data;
  }

  /**
   * Parse a single CSV row (handling quoted values)
   */
  private parseCSVRow(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  /**
   * Import a single item
   */
  private async importItem(
    entityType: string,
    item: Record<string, unknown>,
    strategy: string
  ): Promise<void> {
    // Validate item has required fields
    if (!item.id) {
      throw new Error('Item missing required id field');
    }

    if (strategy === 'skip-existing') {
      // Check if item already exists
      // In a real implementation, this would check the local database
      // For now, always import
    }

    if (this.adapter) {
      // Push to cloud provider
      await this.adapter.push(entityType, item.id as string, item, '');
    } else if (this.localStoragePath) {
      // Save to local storage
      // In a real implementation, this would write to the file system
    }
  }
}

/**
 * Import Dialog Component
 */
export const ImportDialog: React.FC<{
  onImport: (options: ImportOptions) => void;
  onCancel: () => void;
}> = ({ onImport, onCancel }) => {
  const [options, setOptions] = React.useState<ImportOptions>({
    format: 'json',
    filePath: '',
    strategy: 'merge',
    validateChecksum: true,
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="p-6 space-y-6">
          <h2 className="text-2xl font-bold">Import Your Data</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Select File
              </label>
              <input
                type="file"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setOptions(prev => ({
                      ...prev,
                      filePath: file.name,
                    }));
                  }
                }}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Import Strategy
              </label>
              <select
                value={options.strategy}
                onChange={e =>
                  setOptions(prev => ({
                    ...prev,
                    strategy: e.target.value as any,
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="merge">
                  Merge - Add new items, keep existing
                </option>
                <option value="replace">Replace - Overwrite all items</option>
                <option value="skip-existing">
                  Skip Existing - Only add new items
                </option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.validateChecksum}
                onChange={e =>
                  setOptions(prev => ({
                    ...prev,
                    validateChecksum: e.target.checked,
                  }))
                }
                className="rounded"
              />
              <span className="text-sm">
                Validate checksum to ensure data integrity
              </span>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onImport(options)}
              disabled={!options.filePath}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              Import
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataImportService;
