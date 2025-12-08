/**
 * Conflict Manager
 * 
 * EPIC-004: Offline Sync - STORY-021 冲突解决
 * 
 * 职责：
 * - 统一协调冲突检测、记录、解决服务
 * - 提供简化的冲突处理 API
 * - 触发冲突事件通知
 */

import type Database from 'better-sqlite3';
import { ConflictDetectionService } from './conflict-detection.service';
import type { VersionedData, ConflictDetectionResult, FieldDiff } from './conflict-detection.service';
import { ConflictRecordService } from './conflict-record.service';
import type { ConflictRecord, ConflictResolution } from './conflict-record.service';
import { ConflictResolverService } from './conflict-resolver.service';
import type { MergeResult, EntityMergeRules } from './conflict-resolver.service';
import { ConflictHistoryService } from './conflict-history.service';
import type { ConflictStats, PaginatedResult, ConflictHistoryFilter, PaginationParams } from './conflict-history.service';

// 冲突事件类型
export type ConflictEventType = 
  | 'conflict:detected'
  | 'conflict:resolved'
  | 'conflict:auto-resolved'
  | 'conflict:manual-required';

// 冲突事件监听器
export type ConflictEventListener = (event: {
  type: ConflictEventType;
  conflict: ConflictRecord;
  resolution?: MergeResult;
}) => void;

// 冲突处理结果
export interface ConflictHandleResult {
  hasConflict: boolean;
  autoResolved: boolean;
  conflict?: ConflictRecord;
  resolution?: MergeResult;
  manualFields?: string[];
}

export class ConflictManager {
  private detectionService: ConflictDetectionService;
  private recordService: ConflictRecordService;
  private resolverService: ConflictResolverService;
  private historyService: ConflictHistoryService;
  
  private listeners: Set<ConflictEventListener> = new Set();

  constructor(private db: Database.Database) {
    this.detectionService = new ConflictDetectionService();
    this.recordService = new ConflictRecordService(db);
    this.resolverService = new ConflictResolverService();
    this.historyService = new ConflictHistoryService(db);
  }

  // ========== 冲突检测与处理 ==========

  /**
   * 检测并处理同步冲突
   * 这是主要的入口方法
   */
  async handleSyncConflict(
    entityType: string,
    entityId: string,
    localData: VersionedData,
    serverData: VersionedData,
    options?: {
      autoResolve?: boolean;
      lastSyncedData?: VersionedData;
    }
  ): Promise<ConflictHandleResult> {
    // 1. 检测冲突
    const detection = this.detectionService.detectConflict(localData, serverData);
    
    if (!detection.hasConflict) {
      return { hasConflict: false, autoResolved: false };
    }

    // 2. 检查是否可以自动解决（服务器版本更新且本地无修改）
    if (options?.autoResolve !== false && options?.lastSyncedData) {
      const shouldAutoUseServer = this.detectionService.shouldAutoResolveToServer(
        localData,
        serverData,
        options.lastSyncedData
      );

      if (shouldAutoUseServer) {
        // 自动使用服务器版本
        return {
          hasConflict: true,
          autoResolved: true,
          resolution: {
            success: true,
            strategy: 'server',
            mergedData: { ...serverData } as Record<string, unknown>,
          },
        };
      }
    }

    // 3. 创建冲突记录
    const conflictRecord = this.recordService.create({
      entityType,
      entityId,
      localData: localData as unknown as Record<string, unknown>,
      serverData: serverData as unknown as Record<string, unknown>,
      conflictingFields: detection.conflictingFields,
    });

    // 4. 尝试自动解决
    const autoResolve = options?.autoResolve !== false;
    
    if (autoResolve) {
      const resolution = this.resolverService.tryAutoResolve(conflictRecord);
      
      if (resolution?.success) {
        // 自动解决成功
        this.recordService.resolve({
          id: conflictRecord.id,
          resolution: resolution.strategy,
          resolvedData: resolution.mergedData,
          resolvedBy: 'auto',
        });

        this.emit({
          type: 'conflict:auto-resolved',
          conflict: conflictRecord,
          resolution,
        });

        return {
          hasConflict: true,
          autoResolved: true,
          conflict: conflictRecord,
          resolution,
        };
      }

      // 需要手动解决
      this.emit({
        type: 'conflict:manual-required',
        conflict: conflictRecord,
        resolution: resolution ?? undefined,
      });

      return {
        hasConflict: true,
        autoResolved: false,
        conflict: conflictRecord,
        resolution: resolution ?? undefined,
        manualFields: resolution?.manualFields,
      };
    }

    // 5. 不自动解决，直接返回冲突
    this.emit({
      type: 'conflict:detected',
      conflict: conflictRecord,
    });

    return {
      hasConflict: true,
      autoResolved: false,
      conflict: conflictRecord,
    };
  }

  /**
   * 手动解决冲突
   */
  resolveManually(
    conflictId: string,
    fieldSelections: Record<string, 'local' | 'server'>
  ): MergeResult | null {
    const conflict = this.recordService.getById(conflictId);
    if (!conflict) return null;

    const resolution = this.resolverService.manualResolve(conflict, fieldSelections);

    if (resolution.success) {
      this.recordService.resolve({
        id: conflictId,
        resolution: 'manual',
        resolvedData: resolution.mergedData,
        resolvedBy: 'user',
      });

      this.emit({
        type: 'conflict:resolved',
        conflict,
        resolution,
      });
    }

    return resolution;
  }

  /**
   * 使用本地版本解决冲突
   */
  resolveWithLocal(conflictId: string): MergeResult | null {
    const conflict = this.recordService.getById(conflictId);
    if (!conflict) return null;

    const resolution = this.resolverService.resolveWithLocal(conflict);

    this.recordService.resolve({
      id: conflictId,
      resolution: 'local',
      resolvedData: resolution.mergedData,
      resolvedBy: 'user',
    });

    this.emit({
      type: 'conflict:resolved',
      conflict,
      resolution,
    });

    return resolution;
  }

  /**
   * 使用服务器版本解决冲突
   */
  resolveWithServer(conflictId: string): MergeResult | null {
    const conflict = this.recordService.getById(conflictId);
    if (!conflict) return null;

    const resolution = this.resolverService.resolveWithServer(conflict);

    this.recordService.resolve({
      id: conflictId,
      resolution: 'server',
      resolvedData: resolution.mergedData,
      resolvedBy: 'user',
    });

    this.emit({
      type: 'conflict:resolved',
      conflict,
      resolution,
    });

    return resolution;
  }

  // ========== 冲突记录查询 ==========

  /**
   * 获取未解决冲突列表
   */
  getUnresolvedConflicts(entityType?: string): ConflictRecord[] {
    return this.recordService.getUnresolved({ entityType });
  }

  /**
   * 获取未解决冲突数量
   */
  getUnresolvedCount(entityType?: string): number {
    return this.recordService.getUnresolvedCount(entityType);
  }

  /**
   * 获取冲突记录
   */
  getConflict(id: string): ConflictRecord | null {
    return this.recordService.getById(id);
  }

  /**
   * 获取实体的未解决冲突
   */
  getEntityConflict(entityType: string, entityId: string): ConflictRecord | null {
    return this.recordService.getUnresolvedByEntity(entityType, entityId);
  }

  /**
   * 检查实体是否有未解决冲突
   */
  hasConflict(entityType: string, entityId: string): boolean {
    return this.recordService.hasUnresolvedConflict(entityType, entityId);
  }

  // ========== 历史查询 ==========

  /**
   * 查询冲突历史
   */
  queryHistory(
    filter?: ConflictHistoryFilter,
    pagination?: PaginationParams
  ): PaginatedResult<ConflictRecord> {
    return this.historyService.query(filter, pagination);
  }

  /**
   * 获取冲突统计
   */
  getStats(): ConflictStats {
    return this.historyService.getStats();
  }

  /**
   * 获取冲突趋势
   */
  getTrend(days?: number): Array<{ date: string; count: number; resolved: number }> {
    return this.historyService.getTrend(days);
  }

  // ========== 配置管理 ==========

  /**
   * 注册实体合并规则
   */
  registerMergeRules(rules: EntityMergeRules): void {
    this.resolverService.registerEntityRules(rules);
  }

  /**
   * 获取实体合并规则
   */
  getMergeRules(entityType: string): EntityMergeRules | undefined {
    return this.resolverService.getEntityRules(entityType);
  }

  // ========== 维护操作 ==========

  /**
   * 清理已解决的历史记录
   */
  cleanupHistory(retentionDays?: number): number {
    return this.recordService.cleanupResolved(retentionDays);
  }

  /**
   * 批量解决冲突
   */
  batchResolve(ids: string[], strategy: 'local' | 'server'): number {
    return this.recordService.resolveBatch(ids, strategy, 'batch');
  }

  // ========== 事件系统 ==========

  /**
   * 添加事件监听器
   */
  addListener(listener: ConflictEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 移除事件监听器
   */
  removeListener(listener: ConflictEventListener): void {
    this.listeners.delete(listener);
  }

  /**
   * 触发事件
   */
  private emit(event: {
    type: ConflictEventType;
    conflict: ConflictRecord;
    resolution?: MergeResult;
  }): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('[ConflictManager] Listener error:', error);
      }
    }
  }

  // ========== 底层服务访问 ==========

  /** 获取检测服务 */
  get detection(): ConflictDetectionService {
    return this.detectionService;
  }

  /** 获取记录服务 */
  get records(): ConflictRecordService {
    return this.recordService;
  }

  /** 获取解决服务 */
  get resolver(): ConflictResolverService {
    return this.resolverService;
  }

  /** 获取历史服务 */
  get history(): ConflictHistoryService {
    return this.historyService;
  }
}
