/**
 * Conflict History Service
 * 
 * EPIC-004: Offline Sync - STORY-021 冲突解决
 * 
 * 职责：
 * - 查询冲突历史记录
 * - 提供过滤和分页功能
 * - 统计冲突数据
 */

import type Database from 'better-sqlite3';
import type { ConflictRecord, ConflictResolution } from './conflict-record.service';
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

// 查询过滤条件
export interface ConflictHistoryFilter {
  entityType?: string;
  entityId?: string;
  resolution?: ConflictResolution;
  resolved?: boolean;
  startDate?: number;
  endDate?: number;
}

// 分页参数
export interface PaginationParams {
  page: number;
  pageSize: number;
}

// 分页结果
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 冲突统计
export interface ConflictStats {
  total: number;
  unresolved: number;
  resolved: number;
  byEntityType: Record<string, { total: number; unresolved: number }>;
  byResolution: Record<string, number>;
  averageResolutionTime: number;  // 毫秒
}

export class ConflictHistoryService {
  constructor(private db: Database.Database) {}

  /**
   * 查询冲突历史（带分页）
   */
  query(
    filter?: ConflictHistoryFilter,
    pagination?: PaginationParams
  ): PaginatedResult<ConflictRecord> {
    const { whereClause, params } = this.buildWhereClause(filter);
    
    // 获取总数
    const countSql = `SELECT COUNT(*) as count FROM conflict_records ${whereClause}`;
    const countStmt = this.db.prepare(countSql);
    const countResult = countStmt.get(...params) as { count: number };
    const total = countResult.count;

    // 分页参数
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 20;
    const offset = (page - 1) * pageSize;
    const totalPages = Math.ceil(total / pageSize);

    // 获取数据
    const dataSql = `
      SELECT * FROM conflict_records 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    const dataStmt = this.db.prepare(dataSql);
    const rows = dataStmt.all(...params, pageSize, offset) as ConflictRecordRow[];

    return {
      items: rows.map(row => this.rowToRecord(row)),
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  /**
   * 获取最近的冲突记录
   */
  getRecent(limit: number = 10): ConflictRecord[] {
    const stmt = this.db.prepare(`
      SELECT * FROM conflict_records 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    const rows = stmt.all(limit) as ConflictRecordRow[];
    return rows.map(row => this.rowToRecord(row));
  }

  /**
   * 获取实体的冲突历史
   */
  getByEntity(entityType: string, entityId: string): ConflictRecord[] {
    const stmt = this.db.prepare(`
      SELECT * FROM conflict_records 
      WHERE entity_type = ? AND entity_id = ?
      ORDER BY created_at DESC
    `);
    const rows = stmt.all(entityType, entityId) as ConflictRecordRow[];
    return rows.map(row => this.rowToRecord(row));
  }

  /**
   * 获取冲突统计数据
   */
  getStats(): ConflictStats {
    // 总数统计
    const totalStmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN resolved_at IS NULL THEN 1 ELSE 0 END) as unresolved,
        SUM(CASE WHEN resolved_at IS NOT NULL THEN 1 ELSE 0 END) as resolved
      FROM conflict_records
    `);
    const totalResult = totalStmt.get() as { 
      total: number; 
      unresolved: number; 
      resolved: number; 
    };

    // 按实体类型统计
    const byTypeStmt = this.db.prepare(`
      SELECT 
        entity_type,
        COUNT(*) as total,
        SUM(CASE WHEN resolved_at IS NULL THEN 1 ELSE 0 END) as unresolved
      FROM conflict_records
      GROUP BY entity_type
    `);
    const byTypeRows = byTypeStmt.all() as Array<{
      entity_type: string;
      total: number;
      unresolved: number;
    }>;

    const byEntityType: Record<string, { total: number; unresolved: number }> = {};
    for (const row of byTypeRows) {
      byEntityType[row.entity_type] = {
        total: row.total,
        unresolved: row.unresolved,
      };
    }

    // 按解决方式统计
    const byResolutionStmt = this.db.prepare(`
      SELECT resolution, COUNT(*) as count
      FROM conflict_records
      WHERE resolved_at IS NOT NULL AND resolution IS NOT NULL
      GROUP BY resolution
    `);
    const byResolutionRows = byResolutionStmt.all() as Array<{
      resolution: string;
      count: number;
    }>;

    const byResolution: Record<string, number> = {};
    for (const row of byResolutionRows) {
      try {
        const parsed = JSON.parse(row.resolution);
        const type = parsed.type ?? 'unknown';
        byResolution[type] = (byResolution[type] ?? 0) + row.count;
      } catch {
        byResolution['unknown'] = (byResolution['unknown'] ?? 0) + row.count;
      }
    }

    // 平均解决时间
    const avgTimeStmt = this.db.prepare(`
      SELECT AVG(resolved_at - created_at) as avg_time
      FROM conflict_records
      WHERE resolved_at IS NOT NULL
    `);
    const avgTimeResult = avgTimeStmt.get() as { avg_time: number | null };

    return {
      total: totalResult.total,
      unresolved: totalResult.unresolved,
      resolved: totalResult.resolved,
      byEntityType,
      byResolution,
      averageResolutionTime: avgTimeResult.avg_time ?? 0,
    };
  }

  /**
   * 获取特定时间范围的冲突趋势
   */
  getTrend(days: number = 7): Array<{ date: string; count: number; resolved: number }> {
    const startTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    // SQLite 日期分组
    const stmt = this.db.prepare(`
      SELECT 
        date(created_at / 1000, 'unixepoch') as date,
        COUNT(*) as count,
        SUM(CASE WHEN resolved_at IS NOT NULL THEN 1 ELSE 0 END) as resolved
      FROM conflict_records
      WHERE created_at >= ?
      GROUP BY date(created_at / 1000, 'unixepoch')
      ORDER BY date ASC
    `);

    const rows = stmt.all(startTime) as Array<{
      date: string;
      count: number;
      resolved: number;
    }>;

    return rows;
  }

  /**
   * 搜索冲突记录
   */
  search(keyword: string, limit: number = 50): ConflictRecord[] {
    // 在实体 ID 和冲突字段中搜索
    const stmt = this.db.prepare(`
      SELECT * FROM conflict_records 
      WHERE entity_id LIKE ? 
         OR local_data LIKE ?
         OR server_data LIKE ?
      ORDER BY created_at DESC
      LIMIT ?
    `);

    const pattern = `%${keyword}%`;
    const rows = stmt.all(pattern, pattern, pattern, limit) as ConflictRecordRow[];
    
    return rows.map(row => this.rowToRecord(row));
  }

  /**
   * 导出冲突历史
   */
  exportHistory(filter?: ConflictHistoryFilter): string {
    const { items } = this.query(filter, { page: 1, pageSize: 10000 });
    
    return JSON.stringify(items, null, 2);
  }

  /**
   * 构建 WHERE 子句
   */
  private buildWhereClause(filter?: ConflictHistoryFilter): {
    whereClause: string;
    params: unknown[];
  } {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filter?.entityType) {
      conditions.push('entity_type = ?');
      params.push(filter.entityType);
    }

    if (filter?.entityId) {
      conditions.push('entity_id = ?');
      params.push(filter.entityId);
    }

    if (filter?.resolved !== undefined) {
      if (filter.resolved) {
        conditions.push('resolved_at IS NOT NULL');
      } else {
        conditions.push('resolved_at IS NULL');
      }
    }

    if (filter?.resolution) {
      conditions.push("json_extract(resolution, '$.type') = ?");
      params.push(filter.resolution);
    }

    if (filter?.startDate) {
      conditions.push('created_at >= ?');
      params.push(filter.startDate);
    }

    if (filter?.endDate) {
      conditions.push('created_at <= ?');
      params.push(filter.endDate);
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    return { whereClause, params };
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
      conflictingFields: JSON.parse(row.conflicting_fields) as FieldDiff[],
      resolution: resolution?.type,
      resolvedData: resolution?.data,
      resolvedAt: row.resolved_at ?? undefined,
      resolvedBy: row.resolved_by ?? undefined,
      createdAt: row.created_at,
    };
  }
}
