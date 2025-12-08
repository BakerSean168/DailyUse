/**
 * Sync Log Service
 * 
 * EPIC-004: Offline Sync - 变更日志管理
 * 
 * 职责：
 * - 记录本地 CRUD 操作到 sync_log 表
 * - 管理待同步变更队列
 * - 提供变更状态查询
 * - 处理同步完成后的标记
 */

import Database from 'better-sqlite3';
import { v4 as uuid } from 'uuid';

// 同步操作类型
export type SyncOperation = 'create' | 'update' | 'delete';

// 数据库行类型 (匹配 database/index.ts 中的 sync_log 表)
interface SyncLogRow {
  id: string;
  entity_type: string;
  entity_id: string;
  operation: string;
  payload: string;
  timestamp: number;
  device_id: string;
  synced: number; // 0 or 1
  version: number;
  sync_error: string | null;
  retry_count: number;
  created_at: number;
  updated_at: number;
}

// 同步日志条目 (业务层)
export interface SyncLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  operation: SyncOperation;
  data: unknown;
  previousData?: unknown;
  timestamp: number;
  deviceId: string;
  synced: boolean;
  version: number;
  syncError?: string;
  retryCount: number;
  createdAt: number;
  updatedAt: number;
}

// 队列限制配置
export const SYNC_LIMITS = {
  MAX_PENDING_CHANGES: 1000,
  WARNING_THRESHOLD: 800,
  BATCH_SIZE: 50,
  MAX_RETRIES: 3,
} as const;

export class SyncLogService {
  constructor(private db: Database.Database) {}

  /**
   * 记录变更到同步日志
   */
  logChange(params: {
    entityType: string;
    entityId: string;
    operation: SyncOperation;
    data: unknown;
    previousData?: unknown;
    deviceId: string;
    version: number;
  }): SyncLogEntry {
    const now = Date.now();
    const id = uuid();
    const payload = JSON.stringify({ 
      data: params.data, 
      previousData: params.previousData 
    });

    this.db.prepare(`
      INSERT INTO sync_log (
        id, entity_type, entity_id, operation, 
        payload, timestamp, device_id, synced, version,
        retry_count, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      params.entityType,
      params.entityId,
      params.operation,
      payload,
      now,
      params.deviceId,
      0, // synced = false
      params.version,
      0, // retry_count
      now,
      now
    );

    // 检查队列是否接近限制
    const pendingCount = this.getPendingCount();
    if (pendingCount >= SYNC_LIMITS.WARNING_THRESHOLD) {
      console.warn(
        `[SyncLogService] Warning: ${pendingCount} pending changes, approaching limit of ${SYNC_LIMITS.MAX_PENDING_CHANGES}`
      );
    }

    return {
      id,
      entityType: params.entityType,
      entityId: params.entityId,
      operation: params.operation,
      data: params.data,
      previousData: params.previousData,
      timestamp: now,
      deviceId: params.deviceId,
      synced: false,
      version: params.version,
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * 获取待同步的变更列表
   */
  getPendingChanges(limit: number = SYNC_LIMITS.BATCH_SIZE): SyncLogEntry[] {
    const rows = this.db.prepare(`
      SELECT * FROM sync_log 
      WHERE synced = 0
      AND retry_count < ?
      ORDER BY timestamp ASC
      LIMIT ?
    `).all(SYNC_LIMITS.MAX_RETRIES, limit) as SyncLogRow[];

    return rows.map(row => this.mapRowToEntry(row));
  }

  /**
   * 获取待同步变更数量
   */
  getPendingCount(): number {
    const result = this.db.prepare(`
      SELECT COUNT(*) as count FROM sync_log 
      WHERE synced = 0
      AND retry_count < ?
    `).get(SYNC_LIMITS.MAX_RETRIES) as { count: number };

    return result.count;
  }

  /**
   * 标记变更为已同步
   */
  markAsSynced(ids: string[]): void {
    if (ids.length === 0) return;

    const now = Date.now();
    const placeholders = ids.map(() => '?').join(',');
    this.db.prepare(`
      UPDATE sync_log 
      SET synced = 1, updated_at = ?
      WHERE id IN (${placeholders})
    `).run(now, ...ids);
  }

  /**
   * 标记变更为失败，增加重试计数
   */
  markAsFailed(ids: string[], error?: string): void {
    if (ids.length === 0) return;

    const now = Date.now();
    const placeholders = ids.map(() => '?').join(',');
    this.db.prepare(`
      UPDATE sync_log 
      SET retry_count = retry_count + 1,
          sync_error = ?,
          updated_at = ?
      WHERE id IN (${placeholders})
    `).run(error || null, now, ...ids);
  }

  /**
   * 记录冲突
   */
  markAsConflict(id: string, serverData: unknown, localData: unknown, conflictingFields: string[]): void {
    const now = Date.now();
    
    // 在 conflict_records 表记录冲突
    this.db.prepare(`
      INSERT INTO conflict_records (
        id, entity_type, entity_id, local_data, server_data,
        conflicting_fields, created_at
      )
      SELECT 
        ?, entity_type, entity_id, ?, ?, ?, ?
      FROM sync_log WHERE id = ?
    `).run(
      uuid(),
      JSON.stringify(localData),
      JSON.stringify(serverData),
      JSON.stringify(conflictingFields),
      now,
      id
    );

    // 标记 sync_log 条目
    this.db.prepare(`
      UPDATE sync_log 
      SET sync_error = 'CONFLICT',
          updated_at = ?
      WHERE id = ?
    `).run(now, id);
  }

  /**
   * 获取特定实体的同步日志
   */
  getLogsForEntity(entityType: string, entityId: string): SyncLogEntry[] {
    const rows = this.db.prepare(`
      SELECT * FROM sync_log 
      WHERE entity_type = ? AND entity_id = ?
      ORDER BY timestamp DESC
    `).all(entityType, entityId) as SyncLogRow[];

    return rows.map(row => this.mapRowToEntry(row));
  }

  /**
   * 清理已同步的日志（保留最近N天）
   */
  cleanupSyncedLogs(retentionDays: number = 7): number {
    const cutoff = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
    
    const result = this.db.prepare(`
      DELETE FROM sync_log 
      WHERE synced = 1 
      AND updated_at < ?
    `).run(cutoff);

    return result.changes;
  }

  /**
   * 检查是否有待同步的变更
   */
  hasPendingChanges(): boolean {
    return this.getPendingCount() > 0;
  }

  /**
   * 获取同步统计信息
   */
  getStats(): {
    pending: number;
    synced: number;
    failed: number;
    total: number;
  } {
    const stats = {
      pending: 0,
      synced: 0,
      failed: 0,
      total: 0,
    };

    // 待同步 (synced = 0, retry_count < MAX_RETRIES)
    const pendingResult = this.db.prepare(`
      SELECT COUNT(*) as count FROM sync_log 
      WHERE synced = 0 AND retry_count < ?
    `).get(SYNC_LIMITS.MAX_RETRIES) as { count: number };
    stats.pending = pendingResult.count;

    // 已同步
    const syncedResult = this.db.prepare(`
      SELECT COUNT(*) as count FROM sync_log WHERE synced = 1
    `).get() as { count: number };
    stats.synced = syncedResult.count;

    // 失败 (达到最大重试次数)
    const failedResult = this.db.prepare(`
      SELECT COUNT(*) as count FROM sync_log 
      WHERE synced = 0 AND retry_count >= ?
    `).get(SYNC_LIMITS.MAX_RETRIES) as { count: number };
    stats.failed = failedResult.count;

    stats.total = stats.pending + stats.synced + stats.failed;

    return stats;
  }

  /**
   * 重置失败的同步日志（允许重试）
   */
  resetFailedLogs(): number {
    const now = Date.now();
    const result = this.db.prepare(`
      UPDATE sync_log 
      SET retry_count = 0, 
          sync_error = NULL,
          updated_at = ?
      WHERE synced = 0 AND retry_count >= ?
    `).run(now, SYNC_LIMITS.MAX_RETRIES);

    return result.changes;
  }

  /**
   * 获取需要重试的日志 (有错误但未达到最大重试次数)
   */
  getRetryableChanges(limit: number = SYNC_LIMITS.BATCH_SIZE): SyncLogEntry[] {
    const rows = this.db.prepare(`
      SELECT * FROM sync_log 
      WHERE synced = 0
      AND retry_count > 0
      AND retry_count < ?
      ORDER BY timestamp ASC
      LIMIT ?
    `).all(SYNC_LIMITS.MAX_RETRIES, limit) as SyncLogRow[];

    return rows.map(row => this.mapRowToEntry(row));
  }

  /**
   * 获取实体的最新版本号
   */
  getLatestVersion(entityType: string, entityId: string): number {
    const result = this.db.prepare(`
      SELECT MAX(version) as max_version FROM sync_log 
      WHERE entity_type = ? AND entity_id = ?
    `).get(entityType, entityId) as { max_version: number | null };

    return result.max_version || 0;
  }

  /**
   * 映射数据库行到 SyncLogEntry
   */
  private mapRowToEntry(row: SyncLogRow): SyncLogEntry {
    const parsedPayload = JSON.parse(row.payload);
    
    return {
      id: row.id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      operation: row.operation as SyncOperation,
      data: parsedPayload.data,
      previousData: parsedPayload.previousData,
      timestamp: row.timestamp,
      deviceId: row.device_id,
      synced: row.synced === 1,
      version: row.version,
      syncError: row.sync_error || undefined,
      retryCount: row.retry_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
