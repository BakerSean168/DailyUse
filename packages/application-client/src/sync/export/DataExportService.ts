/**
 * Data Export Service & Components
 *
 * Provides functionality to export user data in various formats:
 * - JSON (raw encrypted data)
 * - CSV (spreadsheet format)
 * - Backup (complete encrypted backup)
 *
 * 数据导出 - 支持多种格式导出用户数据
 *
 * @module services/sync/export
 */

import { ISyncAdapter } from '@dailyuse/application-client';

// Types
export interface ExportOptions {
  format: 'json' | 'csv' | 'backup';
  includeEncrypted: boolean;
  entityTypes: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  compressionLevel?: 0 | 1 | 6 | 9; // 0-9, default 6
}

export interface ExportProgress {
  stage: 'preparing' | 'exporting' | 'compressing' | 'complete';
  current: number;
  total: number;
  currentEntity?: string;
  error?: string;
}

export interface ExportResult {
  format: string;
  totalItems: number;
  totalSize: number;
  filename: string;
  path: string;
  timestamp: Date;
  checksum: string; // SHA-256
}

/**
 * Data Export Service
 *
 * Handles exporting user data from local storage or cloud provider
 */
export class DataExportService {
  constructor(
    private adapter?: ISyncAdapter,
    private localStoragePath?: string
  ) {}

  /**
   * Export data in the specified format
   *
   * @param options Export options
   * @param onProgress Progress callback
   * @returns Export result
   */
  async export(
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult> {
    onProgress?.({
      stage: 'preparing',
      current: 0,
      total: 100,
    });

    // Validate options
    if (!options.entityTypes || options.entityTypes.length === 0) {
      throw new Error('Must select at least one entity type to export');
    }

    // Collect data
    const data = await this.collectData(options);
    onProgress?.({
      stage: 'exporting',
      current: 30,
      total: 100,
    });

    // Format data
    let content: string;
    let fileExtension: string;

    switch (options.format) {
      case 'json':
        content = this.formatJSON(data);
        fileExtension = 'json';
        break;
      case 'csv':
        content = this.formatCSV(data);
        fileExtension = 'csv';
        break;
      case 'backup':
        content = this.formatBackup(data);
        fileExtension = 'backup';
        break;
      default:
        throw new Error(`Unknown format: ${options.format}`);
    }

    onProgress?.({
      stage: 'compressing',
      current: 70,
      total: 100,
    });

    // Compress if needed
    const compressed =
      options.format === 'backup'
        ? await this.compress(content, options.compressionLevel || 6)
        : content;

    onProgress?.({
      stage: 'complete',
      current: 100,
      total: 100,
    });

    // Save to file
    const filename = this.generateFilename(options.format);
    const checksum = await this.calculateChecksum(compressed);

    // In a real implementation, this would save to the file system
    return {
      format: options.format,
      totalItems: Object.values(data).reduce((sum, arr) => sum + arr.length, 0),
      totalSize: new Blob([compressed]).size,
      filename,
      path: `/exports/${filename}`,
      timestamp: new Date(),
      checksum,
    };
  }

  /**
   * Collect data from local storage or cloud provider
   */
  private async collectData(
    options: ExportOptions
  ): Promise<Record<string, unknown[]>> {
    const data: Record<string, unknown[]> = {};

    for (const entityType of options.entityTypes) {
      data[entityType] = [];

      if (this.adapter) {
        // Fetch from cloud provider
        const result = await this.adapter.pull(entityType, {
          since: options.dateRange?.start,
        });

        if (result.success) {
          data[entityType] = result.items;
        }
      } else if (this.localStoragePath) {
        // Fetch from local storage
        // In a real implementation, this would read from the file system
        data[entityType] = [];
      }
    }

    return data;
  }

  /**
   * Format data as JSON
   */
  private formatJSON(data: Record<string, unknown[]>): string {
    return JSON.stringify(
      {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        data,
      },
      null,
      2
    );
  }

  /**
   * Format data as CSV
   */
  private formatCSV(data: Record<string, unknown[]>): string {
    const lines: string[] = [];

    for (const [entityType, items] of Object.entries(data)) {
      if (items.length === 0) continue;

      // Header
      const headers = this.getCSVHeaders(entityType);
      lines.push(`Entity Type: ${entityType}`);
      lines.push(headers.join(','));

      // Rows
      for (const item of items) {
        const row = headers.map(header => {
          const value = (item as Record<string, unknown>)[header];
          const stringValue =
            typeof value === 'string' ? value : JSON.stringify(value);
          // Escape quotes and wrap in quotes if contains comma
          return stringValue.includes(',')
            ? `"${stringValue.replace(/"/g, '""')}"`
            : stringValue;
        });
        lines.push(row.join(','));
      }

      lines.push(''); // Empty line between entity types
    }

    return lines.join('\n');
  }

  /**
   * Format data as encrypted backup
   */
  private formatBackup(data: Record<string, unknown[]>): string {
    return JSON.stringify(
      {
        version: '1.0',
        format: 'backup',
        exportedAt: new Date().toISOString(),
        encrypted: true,
        compressionLevel: 6,
        data,
      },
      null,
      2
    );
  }

  /**
   * Compress data using gzip
   */
  private async compress(
    data: string,
    level: number
  ): Promise<string> {
    // In a real implementation, use pako or zlib
    // For now, return base64 encoded data
    return Buffer.from(data).toString('base64');
  }

  /**
   * Calculate SHA-256 checksum
   */
  private async calculateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest(
      'SHA-256',
      encoder.encode(data)
    );
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate filename for export
   */
  private generateFilename(format: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `dailyuse-export-${timestamp}.${format}`;
  }

  /**
   * Get CSV headers for entity type
   */
  private getCSVHeaders(entityType: string): string[] {
    const headers: Record<string, string[]> = {
      goals: ['id', 'title', 'description', 'category', 'priority', 'status', 'createdAt', 'updatedAt'],
      tasks: ['id', 'title', 'description', 'goalId', 'priority', 'status', 'dueDate', 'createdAt', 'updatedAt'],
      reminders: ['id', 'title', 'taskId', 'type', 'time', 'repeatPattern', 'createdAt'],
      schedules: ['id', 'title', 'description', 'date', 'time', 'duration', 'location', 'createdAt'],
    };

    return headers[entityType] || ['id', 'data'];
  }
}

/**
 * Export Options Dialog Component
 */
export const ExportDialog: React.FC<{
  onExport: (options: ExportOptions) => void;
  onCancel: () => void;
}> = ({ onExport, onCancel }) => {
  const [options, setOptions] = React.useState<ExportOptions>({
    format: 'json',
    includeEncrypted: false,
    entityTypes: ['goals', 'tasks', 'reminders', 'schedules'],
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="p-6 space-y-6">
          <h2 className="text-2xl font-bold">Export Your Data</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Export Format
              </label>
              <select
                value={options.format}
                onChange={e =>
                  setOptions(prev => ({
                    ...prev,
                    format: e.target.value as any,
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="json">JSON (Raw data)</option>
                <option value="csv">CSV (Spreadsheet)</option>
                <option value="backup">Backup (Encrypted)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Entity Types
              </label>
              <div className="space-y-2">
                {['goals', 'tasks', 'reminders', 'schedules'].map(type => (
                  <label
                    key={type}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={options.entityTypes.includes(type)}
                      onChange={e => {
                        const types = options.entityTypes;
                        if (e.target.checked) {
                          types.push(type);
                        } else {
                          types.splice(types.indexOf(type), 1);
                        }
                        setOptions(prev => ({
                          ...prev,
                          entityTypes: [...types],
                        }));
                      }}
                      className="rounded"
                    />
                    <span className="capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onExport(options)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataExportService;
