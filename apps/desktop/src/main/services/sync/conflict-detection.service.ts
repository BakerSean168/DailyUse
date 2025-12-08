/**
 * Conflict Detection Service
 * 
 * EPIC-004: Offline Sync - STORY-021 冲突解决
 * 
 * 职责：
 * - 比较本地和服务器数据版本
 * - 检测字段级别的差异
 * - 识别冲突字段
 */

// 字段差异信息
export interface FieldDiff {
  field: string;
  localValue: unknown;
  serverValue: unknown;
}

// 冲突检测结果
export interface ConflictDetectionResult {
  hasConflict: boolean;
  conflictingFields: FieldDiff[];
  localOnlyFields: string[];
  serverOnlyFields: string[];
  localVersion: number;
  serverVersion: number;
}

// 版本化数据接口
export interface VersionedData {
  version: number;
  updatedAt: number;
  [key: string]: unknown;
}

export class ConflictDetectionService {
  // 忽略的系统字段，不参与冲突检测
  private static readonly IGNORED_FIELDS = new Set([
    'version',
    'updatedAt',
    'updated_at',
    'createdAt',
    'created_at',
    'syncVersion',
    'sync_version',
  ]);

  /**
   * 检测两个版本数据之间的冲突
   */
  detectConflict(
    localData: VersionedData,
    serverData: VersionedData,
    options?: {
      fieldsToCompare?: string[];
      fieldsToIgnore?: string[];
    }
  ): ConflictDetectionResult {
    const localVersion = localData.version ?? 0;
    const serverVersion = serverData.version ?? 0;

    // 如果版本相同，无冲突
    if (localVersion === serverVersion) {
      return {
        hasConflict: false,
        conflictingFields: [],
        localOnlyFields: [],
        serverOnlyFields: [],
        localVersion,
        serverVersion,
      };
    }

    // 获取所有要比较的字段
    const localFields = new Set(Object.keys(localData));
    const serverFields = new Set(Object.keys(serverData));

    const ignoredFields = new Set([
      ...ConflictDetectionService.IGNORED_FIELDS,
      ...(options?.fieldsToIgnore ?? []),
    ]);

    // 如果指定了特定字段，只比较这些字段
    const fieldsToCompare = options?.fieldsToCompare 
      ? new Set(options.fieldsToCompare)
      : null;

    const conflictingFields: FieldDiff[] = [];
    const localOnlyFields: string[] = [];
    const serverOnlyFields: string[] = [];

    // 遍历所有字段
    const allFields = new Set([...localFields, ...serverFields]);

    for (const field of allFields) {
      // 跳过忽略的字段
      if (ignoredFields.has(field)) continue;
      
      // 如果指定了特定字段，跳过未指定的
      if (fieldsToCompare && !fieldsToCompare.has(field)) continue;

      const inLocal = localFields.has(field);
      const inServer = serverFields.has(field);

      if (inLocal && !inServer) {
        localOnlyFields.push(field);
      } else if (!inLocal && inServer) {
        serverOnlyFields.push(field);
      } else if (inLocal && inServer) {
        // 比较值
        const localValue = localData[field];
        const serverValue = serverData[field];

        if (!this.deepEqual(localValue, serverValue)) {
          conflictingFields.push({
            field,
            localValue,
            serverValue,
          });
        }
      }
    }

    const hasConflict = conflictingFields.length > 0 || 
                        localOnlyFields.length > 0 || 
                        serverOnlyFields.length > 0;

    return {
      hasConflict,
      conflictingFields,
      localOnlyFields,
      serverOnlyFields,
      localVersion,
      serverVersion,
    };
  }

  /**
   * 检测多个实体的冲突
   */
  detectBatchConflicts<T extends VersionedData>(
    localItems: Map<string, T>,
    serverItems: Map<string, T>,
  ): Map<string, ConflictDetectionResult> {
    const results = new Map<string, ConflictDetectionResult>();

    // 检查所有本地项
    for (const [id, localData] of localItems) {
      const serverData = serverItems.get(id);
      
      if (serverData) {
        const result = this.detectConflict(localData, serverData);
        if (result.hasConflict) {
          results.set(id, result);
        }
      }
    }

    return results;
  }

  /**
   * 比较特定字段
   */
  compareFields(
    localData: Record<string, unknown>,
    serverData: Record<string, unknown>,
    fields: string[]
  ): FieldDiff[] {
    const diffs: FieldDiff[] = [];

    for (const field of fields) {
      const localValue = localData[field];
      const serverValue = serverData[field];

      if (!this.deepEqual(localValue, serverValue)) {
        diffs.push({ field, localValue, serverValue });
      }
    }

    return diffs;
  }

  /**
   * 深度比较两个值
   */
  private deepEqual(a: unknown, b: unknown): boolean {
    // 处理相同引用或基本类型相等
    if (a === b) return true;

    // 处理 null/undefined
    if (a == null || b == null) return a === b;

    // 处理日期
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }

    // 处理数组
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => this.deepEqual(item, b[index]));
    }

    // 处理对象
    if (typeof a === 'object' && typeof b === 'object') {
      const keysA = Object.keys(a as object);
      const keysB = Object.keys(b as object);

      if (keysA.length !== keysB.length) return false;

      return keysA.every(key => {
        return Object.prototype.hasOwnProperty.call(b, key) &&
               this.deepEqual(
                 (a as Record<string, unknown>)[key],
                 (b as Record<string, unknown>)[key]
               );
      });
    }

    return false;
  }

  /**
   * 判断是否应该自动解决（服务器版本更新且本地无修改）
   */
  shouldAutoResolveToServer(
    localData: VersionedData,
    serverData: VersionedData,
    lastSyncedData?: VersionedData
  ): boolean {
    // 如果有上次同步的数据，检查本地是否有修改
    if (lastSyncedData) {
      const localChanges = this.detectConflict(lastSyncedData, localData);
      
      // 如果本地没有修改，自动使用服务器版本
      if (!localChanges.hasConflict) {
        return true;
      }
    }

    // 如果服务器版本更高且本地版本未变，自动使用服务器
    if (serverData.version > localData.version) {
      return !lastSyncedData; // 无基准数据时，采用服务器版本
    }

    return false;
  }
}
