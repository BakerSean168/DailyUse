/**
 * Conflict Record Service
 * 
 * EPIC-004: Offline Sync - STORY-021 冲突解决
 * 
 * 职责：
 * - 管理 conflict_records 表的 CRUD 操作
 * - 记录冲突详情
 * - 标记冲突已解决
 */

import type Database from 'better-sqlite3';
import { v4 as uuid } from 'uuid';
import type { FieldDiff } from './conflict-detection.service';

// 数据库行类型
interface ConflictRecordRow {
  id: string;
  entity_type: string;
  entity_id: string;
  local_data: string;
  server_data: string;
  conflicting_fields: string;
  resolution: string | null;
  resolved_at: number | null;
  resolved_by: string | null;
  created_at: number;
}

// 冲突解决方式
export type ConflictResolution = 
  | 'local'      // 使用本地版本
  | 'server'     // 使用服务器版本
  | 'merged'     // 合并两者
  | 'manual';    // 用户手动选择

// 业务层冲突记录
export interface ConflictRecord {
  id: string;
  entityType: string;
  entityId: string;
  localData: Record<string, unknown>;
  serverData: Record<string, unknown>;
  conflictingFields: FieldDiff[];
  resolution?: ConflictResolution;
  resolvedData?: Record<string, unknown>;
  resolvedAt?: number;
  resolvedBy?: string;
  createdAt: number;
}

// 创建冲突记录参数
export interface CreateConflictParams {
  entityType: string;
  entityId: string;
  localData: Record<string, unknown>;
  serverData: Record<string, unknown>;
  conflictingFields: FieldDiff[];
}

// 解决冲突参数
export interface ResolveConflictParams {
  id: string;
  resolution: ConflictResolution;
  resolvedData: Record<string, unknown>;
  resolvedBy?: string;
}

export class ConflictRecordService {
  constructor(private db: Database.Database) {}

  /**
   * 创建冲突记录
   */
  create(params: CreateConflictParams): ConflictRecord {
    const now = Date.now();
    const id = uuid();

    const stmt = this.db.prepare(`
      INSERT INTO conflict_records (
        id, entity_type, entity_id, local_data, server_data,
        conflicting_fields, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      params.entityType,
      params.entityId,
      JSON.stringify(params.localData),
      JSON.stringify(params.serverData),
      JSON.stringify(params.conflictingFields),
      now
    );

    return {
      id,
      entityType: params.entityType,
      entityId: params.entityId,
      localData: params.localData,
      serverData: params.serverData,
      conflictingFields: params.conflictingFields,
      createdAt: now,
    };
  }

  /**
   * 获取冲突记录
   */
  getById(id: string): ConflictRecord | null {
    const stmt = this.db.prepare('SELECT * FROM conflict_records WHERE id = ?');
    const row = stmt.get(id) as ConflictRecordRow | undefined;
    
    if (!row) return null;
    return this.rowToRecord(row);
  }

  /**
   * 获取实体的未解决冲突
   */
  getUnresolvedByEntity(entityType: string, entityId: string): ConflictRecord | null {
    const stmt = this.db.prepare(`
      SELECT * FROM conflict_records 
      WHERE entity_type = ? AND entity_id = ? AND resolved_at IS NULL
      ORDER BY created_at DESC LIMIT 1
    `);
    const row = stmt.get(entityType, entityId) as ConflictRecordRow | undefined;
    
    if (!row) return null;
    return this.rowToRecord(row);
  }

  /**
   * 获取所有未解决冲突
   */
  getUnresolved(options?: {
    entityType?: string;
    limit?: number;
    offset?: number;
  }): ConflictRecord[] {
    let sql = 'SELECT * FROM conflict_records WHERE resolved_at IS NULL';
    const params: unknown[] = [];

    if (options?.entityType) {
      sql += ' AND entity_type = ?';
      params.push(options.entityType);
    }

    sql += ' ORDER BY created_at DESC';

    if (options?.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
    }

    if (options?.offset) {
      sql += ' OFFSET ?';
      params.push(options.offset);
    }

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as ConflictRecordRow[];
    
    return rows.map(row => this.rowToRecord(row));
  }

  /**
   * 获取未解决冲突数量
   */
  getUnresolvedCount(entityType?: string): number {
    let sql = 'SELECT COUNT(*) as count FROM conflict_records WHERE resolved_at IS NULL';
    const params: unknown[] = [];

    if (entityType) {
      sql += ' AND entity_type = ?';
      params.push(entityType);
    }

    const stmt = this.db.prepare(sql);
    const result = stmt.get(...params) as { count: number };
    
    return result.count;
  }

  /**
   * 解决冲突
   */
  resolve(params: ResolveConflictParams): boolean {
    const now = Date.now();
    
    // 构建 resolution JSON
    const resolutionData = JSON.stringify({
      type: params.resolution,
      data: params.resolvedData,
    });

    const stmt = this.db.prepare(`
      UPDATE conflict_records 
      SET resolution = ?, resolved_at = ?, resolved_by = ?
      WHERE id = ? AND resolved_at IS NULL
    `);

    const result = stmt.run(
      resolutionData,
      now,
      params.resolvedBy ?? 'user',
      params.id
    );

    return result.changes > 0;
  }

  /**
   * 批量解决冲突（使用同一策略）
   */
  resolveBatch(
    ids: string[],
    resolution: ConflictResolution,
    resolvedBy?: string
  ): number {
    const now = Date.now();
    
    const stmt = this.db.prepare(`
      UPDATE conflict_records 
      SET resolution = ?, resolved_at = ?, resolved_by = ?
      WHERE id = ? AND resolved_at IS NULL
    `);

    let resolved = 0;
    const transaction = this.db.transaction(() => {
      for (const id of ids) {
        const record = this.getById(id);
        if (!record || record.resolvedAt) continue;

        // 根据解决策略获取最终数据
        const resolvedData = resolution === 'local' 
          ? record.localData 
          : record.serverData;

        const resolutionData = JSON.stringify({
          type: resolution,
          data: resolvedData,
        });

        const result = stmt.run(resolutionData, now, resolvedBy ?? 'batch', id);
        resolved += result.changes;
      }
    });

    transaction();
    return resolved;
  }

  /**
   * 删除已解决的冲突记录（保留一定天数）
   */
  cleanupResolved(retentionDays: number = 30): number {
    const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
    
    const stmt = this.db.prepare(`
      DELETE FROM conflict_records 
      WHERE resolved_at IS NOT NULL AND resolved_at < ?
    `);

    const result = stmt.run(cutoffTime);
    return result.changes;
  }

  /**
   * 删除冲突记录
   */
  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM conflict_records WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * 检查实体是否有未解决冲突
   */
  hasUnresolvedConflict(entityType: string, entityId: string): boolean {
    const stmt = this.db.prepare(`
      SELECT 1 FROM conflict_records 
      WHERE entity_type = ? AND entity_id = ? AND resolved_at IS NULL
      LIMIT 1
    `);
    return !!stmt.get(entityType, entityId);
  }

  /**
   * 将数据库行转换为业务对象
   */
  private rowToRecord(row: ConflictRecordRow): ConflictRecord {
    const resolution = row.resolution ? JSON.parse(row.resolution) : null;

    return {
      id: row.id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      localData: JSON.parse(row.local_data),
      serverData: JSON.parse(row.server_data),
      conflictingFields: JSON.parse(row.conflicting_fields),
      resolution: resolution?.type,
      resolvedData: resolution?.data,
      resolvedAt: row.resolved_at ?? undefined,
      resolvedBy: row.resolved_by ?? undefined,
      createdAt: row.created_at,
    };
  }
}
