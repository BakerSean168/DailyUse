/**
 * Conflict Resolver Service
 * 
 * EPIC-004: Offline Sync - STORY-021 冲突解决
 * 
 * 职责：
 * - 实现自动合并策略
 * - 处理特定实体类型的合并规则
 * - 支持手动解决回调
 */

import type { FieldDiff, VersionedData } from './conflict-detection.service';
import type { ConflictRecord, ConflictResolution } from './conflict-record.service';

// 字段合并策略
export type FieldMergeStrategy = 
  | 'local'           // 始终使用本地值
  | 'server'          // 始终使用服务器值
  | 'max'             // 使用较大值（数值）
  | 'min'             // 使用较小值（数值）
  | 'latest'          // 使用最新时间戳
  | 'concat'          // 连接字符串/数组
  | 'manual';         // 需要手动解决

// 实体合并规则配置
export interface EntityMergeRules {
  entityType: string;
  fieldRules: Record<string, FieldMergeStrategy>;
  defaultStrategy: FieldMergeStrategy;
}

// 合并结果
export interface MergeResult {
  success: boolean;
  strategy: ConflictResolution;
  mergedData: Record<string, unknown>;
  manualFields?: string[];  // 需要手动解决的字段
}

// 状态优先级（用于 status 字段合并）
const STATUS_PRIORITY: Record<string, number> = {
  'COMPLETED': 100,
  'IN_PROGRESS': 80,
  'ACTIVE': 70,
  'PAUSED': 50,
  'PENDING': 40,
  'CANCELLED': 30,
  'ARCHIVED': 20,
  'DRAFT': 10,
};

export class ConflictResolverService {
  // 默认实体合并规则
  private readonly entityRules: Map<string, EntityMergeRules> = new Map<string, EntityMergeRules>([
    // Goal 实体规则
    ['goal', {
      entityType: 'goal',
      fieldRules: {
        title: 'manual',
        description: 'manual',
        progress: 'max',
        status: 'server',  // 使用自定义 status 合并
        dueDate: 'min',
        priority: 'server',
        tags: 'server',
      } as Record<string, FieldMergeStrategy>,
      defaultStrategy: 'server',
    }],
    
    // Task 实体规则
    ['task', {
      entityType: 'task',
      fieldRules: {
        title: 'manual',
        description: 'manual',
        status: 'server',  // 完成状态优先
        dueDate: 'min',
        priority: 'server',
        estimatedTime: 'max',
        actualTime: 'max',
      } as Record<string, FieldMergeStrategy>,
      defaultStrategy: 'server',
    }],
    
    // KeyResult 实体规则
    ['keyResult', {
      entityType: 'keyResult',
      fieldRules: {
        title: 'manual',
        progress: 'max',
        currentValue: 'max',
        targetValue: 'server',
        unit: 'server',
      } as Record<string, FieldMergeStrategy>,
      defaultStrategy: 'server',
    }],
    
    // Setting 实体规则 - 始终使用服务器（最后写入胜出）
    ['setting', {
      entityType: 'setting',
      fieldRules: {} as Record<string, FieldMergeStrategy>,
      defaultStrategy: 'server',
    }],
  ]);

  /**
   * 注册自定义实体规则
   */
  registerEntityRules(rules: EntityMergeRules): void {
    this.entityRules.set(rules.entityType.toLowerCase(), rules);
  }

  /**
   * 尝试自动解决冲突
   */
  tryAutoResolve(conflict: ConflictRecord): MergeResult | null {
    const rules = this.entityRules.get(conflict.entityType.toLowerCase());
    
    if (!rules) {
      // 无规则，使用服务器版本
      return {
        success: true,
        strategy: 'server',
        mergedData: { ...conflict.serverData },
      };
    }

    const mergedData: Record<string, unknown> = {};
    const manualFields: string[] = [];

    // 合并所有字段
    const allFields = new Set([
      ...Object.keys(conflict.localData),
      ...Object.keys(conflict.serverData),
    ]);

    for (const field of allFields) {
      const strategy = rules.fieldRules[field] ?? rules.defaultStrategy;
      const localValue = conflict.localData[field];
      const serverValue = conflict.serverData[field];

      // 检查是否为冲突字段
      const isConflicting = conflict.conflictingFields.some(f => f.field === field);

      if (!isConflicting) {
        // 非冲突字段，使用存在的值
        mergedData[field] = serverValue ?? localValue;
        continue;
      }

      // 应用合并策略
      const mergeResult = this.applyStrategy(
        strategy,
        field,
        localValue,
        serverValue,
        conflict.entityType
      );

      if (mergeResult.needsManual) {
        manualFields.push(field);
        mergedData[field] = serverValue; // 临时使用服务器值
      } else {
        mergedData[field] = mergeResult.value;
      }
    }

    // 如果有需要手动解决的字段，返回部分合并结果
    if (manualFields.length > 0) {
      return {
        success: false,
        strategy: 'manual',
        mergedData,
        manualFields,
      };
    }

    return {
      success: true,
      strategy: 'merged',
      mergedData,
    };
  }

  /**
   * 应用字段合并策略
   */
  private applyStrategy(
    strategy: FieldMergeStrategy,
    field: string,
    localValue: unknown,
    serverValue: unknown,
    entityType: string
  ): { value: unknown; needsManual: boolean } {
    switch (strategy) {
      case 'local':
        return { value: localValue, needsManual: false };

      case 'server':
        // status 字段特殊处理：完成状态优先
        if (field === 'status') {
          const value = this.mergeStatus(localValue, serverValue);
          return { value, needsManual: false };
        }
        return { value: serverValue, needsManual: false };

      case 'max':
        if (typeof localValue === 'number' && typeof serverValue === 'number') {
          return { value: Math.max(localValue, serverValue), needsManual: false };
        }
        return { value: serverValue, needsManual: false };

      case 'min':
        if (typeof localValue === 'number' && typeof serverValue === 'number') {
          return { value: Math.min(localValue, serverValue), needsManual: false };
        }
        // 日期字段：选择较早的
        if (localValue && serverValue) {
          const localTime = new Date(localValue as string | number).getTime();
          const serverTime = new Date(serverValue as string | number).getTime();
          if (!isNaN(localTime) && !isNaN(serverTime)) {
            return { 
              value: localTime < serverTime ? localValue : serverValue, 
              needsManual: false 
            };
          }
        }
        return { value: serverValue ?? localValue, needsManual: false };

      case 'latest':
        // 使用更新时间戳较新的
        return { value: serverValue, needsManual: false };

      case 'concat':
        if (Array.isArray(localValue) && Array.isArray(serverValue)) {
          const merged = [...new Set([...localValue, ...serverValue])];
          return { value: merged, needsManual: false };
        }
        if (typeof localValue === 'string' && typeof serverValue === 'string') {
          return { value: `${localValue}\n${serverValue}`, needsManual: false };
        }
        return { value: serverValue, needsManual: false };

      case 'manual':
      default:
        return { value: serverValue, needsManual: true };
    }
  }

  /**
   * 合并 status 字段（优先级高的胜出）
   */
  private mergeStatus(localValue: unknown, serverValue: unknown): unknown {
    if (typeof localValue !== 'string' || typeof serverValue !== 'string') {
      return serverValue;
    }

    const localPriority = STATUS_PRIORITY[localValue.toUpperCase()] ?? 0;
    const serverPriority = STATUS_PRIORITY[serverValue.toUpperCase()] ?? 0;

    // 较高优先级胜出（例如：COMPLETED > IN_PROGRESS）
    return localPriority >= serverPriority ? localValue : serverValue;
  }

  /**
   * 手动解决冲突
   */
  manualResolve(
    conflict: ConflictRecord,
    fieldSelections: Record<string, 'local' | 'server'>
  ): MergeResult {
    const mergedData: Record<string, unknown> = {};

    // 从非冲突字段开始
    const allFields = new Set([
      ...Object.keys(conflict.localData),
      ...Object.keys(conflict.serverData),
    ]);

    const conflictingFieldNames = new Set(
      conflict.conflictingFields.map(f => f.field)
    );

    for (const field of allFields) {
      if (conflictingFieldNames.has(field)) {
        // 冲突字段：使用用户选择
        const selection = fieldSelections[field] ?? 'server';
        mergedData[field] = selection === 'local' 
          ? conflict.localData[field] 
          : conflict.serverData[field];
      } else {
        // 非冲突字段：使用服务器值（如存在）
        mergedData[field] = conflict.serverData[field] ?? conflict.localData[field];
      }
    }

    return {
      success: true,
      strategy: 'manual',
      mergedData,
    };
  }

  /**
   * 强制使用本地版本解决
   */
  resolveWithLocal(conflict: ConflictRecord): MergeResult {
    return {
      success: true,
      strategy: 'local',
      mergedData: { ...conflict.localData },
    };
  }

  /**
   * 强制使用服务器版本解决
   */
  resolveWithServer(conflict: ConflictRecord): MergeResult {
    return {
      success: true,
      strategy: 'server',
      mergedData: { ...conflict.serverData },
    };
  }

  /**
   * 获取实体的合并规则
   */
  getEntityRules(entityType: string): EntityMergeRules | undefined {
    return this.entityRules.get(entityType.toLowerCase());
  }

  /**
   * 获取所有已注册的实体类型
   */
  getRegisteredEntityTypes(): string[] {
    return Array.from(this.entityRules.keys());
  }
}
