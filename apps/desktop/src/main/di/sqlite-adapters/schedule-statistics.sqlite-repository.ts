/**
 * SQLite ScheduleStatistics Repository
 *
 * 实现 IScheduleStatisticsRepository 接口的 SQLite 适配器
 * 遵循 DDD Repository 模式
 */

import type { IScheduleStatisticsRepository } from '@dailyuse/domain-server/schedule';
import { ScheduleStatistics } from '@dailyuse/domain-server/schedule';
import type { ScheduleStatisticsPersistenceDTO } from '@dailyuse/contracts/schedule';
import { getDatabase, transaction } from '../../database';

/**
 * ScheduleStatistics SQLite Repository 实现
 */
export class SqliteScheduleStatisticsRepository implements IScheduleStatisticsRepository {
  // ============ 基本 CRUD ============

  /**
   * 保存 ScheduleStatistics 聚合根（UPSERT）
   */
  async save(statistics: ScheduleStatistics): Promise<void> {
    const db = getDatabase();
    const dto = statistics.toPersistenceDTO();

    transaction(() => {
      const existing = db
        .prepare('SELECT account_uuid FROM schedule_statistics WHERE account_uuid = ?')
        .get(dto.accountUuid);

      if (existing) {
        db.prepare(`
          UPDATE schedule_statistics SET
            total_tasks = ?,
            active_tasks = ?,
            paused_tasks = ?,
            completed_tasks = ?,
            cancelled_tasks = ?,
            failed_tasks = ?,
            total_executions = ?,
            successful_executions = ?,
            failed_executions = ?,
            skipped_executions = ?,
            timeout_executions = ?,
            avg_execution_duration = ?,
            min_execution_duration = ?,
            max_execution_duration = ?,
            module_statistics = ?,
            last_updated_at = ?
          WHERE account_uuid = ?
        `).run(
          dto.totalTasks,
          dto.activeTasks,
          dto.pausedTasks,
          dto.completedTasks,
          dto.cancelledTasks,
          dto.failedTasks,
          dto.totalExecutions,
          dto.successfulExecutions,
          dto.failedExecutions,
          dto.skippedExecutions,
          dto.timeoutExecutions,
          dto.avgExecutionDuration,
          dto.minExecutionDuration,
          dto.maxExecutionDuration,
          dto.moduleStatistics,
          dto.lastUpdatedAt,
          dto.accountUuid
        );
      } else {
        db.prepare(`
          INSERT INTO schedule_statistics (
            account_uuid,
            total_tasks, active_tasks, paused_tasks, completed_tasks, cancelled_tasks, failed_tasks,
            total_executions, successful_executions, failed_executions, skipped_executions, timeout_executions,
            avg_execution_duration, min_execution_duration, max_execution_duration,
            module_statistics,
            created_at, last_updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          dto.accountUuid,
          dto.totalTasks,
          dto.activeTasks,
          dto.pausedTasks,
          dto.completedTasks,
          dto.cancelledTasks,
          dto.failedTasks,
          dto.totalExecutions,
          dto.successfulExecutions,
          dto.failedExecutions,
          dto.skippedExecutions,
          dto.timeoutExecutions,
          dto.avgExecutionDuration,
          dto.minExecutionDuration,
          dto.maxExecutionDuration,
          dto.moduleStatistics,
          dto.createdAt,
          dto.lastUpdatedAt
        );
      }
    });
  }

  /**
   * 根据账户 UUID 查找统计数据
   */
  async findByAccountUuid(accountUuid: string): Promise<ScheduleStatistics | null> {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM schedule_statistics WHERE account_uuid = ?')
      .get(accountUuid) as ScheduleStatisticsRow | undefined;

    if (!row) {
      return null;
    }

    return this.mapToEntity(row);
  }

  /**
   * 根据账户 UUID 获取统计数据，不存在则创建
   */
  async getOrCreate(accountUuid: string): Promise<ScheduleStatistics> {
    const existing = await this.findByAccountUuid(accountUuid);
    
    if (existing) {
      return existing;
    }

    // 创建新的空统计
    const newStatistics = ScheduleStatistics.createEmpty(accountUuid);
    await this.save(newStatistics);
    
    return newStatistics;
  }

  /**
   * 删除统计数据
   */
  async deleteByAccountUuid(accountUuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM schedule_statistics WHERE account_uuid = ?').run(accountUuid);
  }

  // ============ 批量操作 ============

  /**
   * 查询所有统计数据（管理员用）
   */
  async findAll(limit: number = 100, offset: number = 0): Promise<ScheduleStatistics[]> {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM schedule_statistics ORDER BY last_updated_at DESC LIMIT ? OFFSET ?')
      .all(limit, offset) as ScheduleStatisticsRow[];

    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 批量保存
   */
  async saveBatch(statistics: ScheduleStatistics[]): Promise<void> {
    transaction(() => {
      for (const stat of statistics) {
        this.saveSync(stat);
      }
    });
  }

  // ============ 事务支持 ============

  /**
   * 在事务中执行操作
   */
  async withTransaction<T>(
    fn: (repo: IScheduleStatisticsRepository) => Promise<T>
  ): Promise<T> {
    return transaction(() => {
      const txRepo = new SqliteScheduleStatisticsRepository();
      return fn(txRepo);
    }) as T;
  }

  // ============ 私有方法 ============

  /**
   * 同步保存（用于事务内）
   */
  private saveSync(statistics: ScheduleStatistics): void {
    const db = getDatabase();
    const dto = statistics.toPersistenceDTO();

    const existing = db
      .prepare('SELECT account_uuid FROM schedule_statistics WHERE account_uuid = ?')
      .get(dto.accountUuid);

    if (existing) {
      db.prepare(`
        UPDATE schedule_statistics SET
          total_tasks = ?,
          active_tasks = ?,
          paused_tasks = ?,
          completed_tasks = ?,
          cancelled_tasks = ?,
          failed_tasks = ?,
          total_executions = ?,
          successful_executions = ?,
          failed_executions = ?,
          skipped_executions = ?,
          timeout_executions = ?,
          avg_execution_duration = ?,
          min_execution_duration = ?,
          max_execution_duration = ?,
          module_statistics = ?,
          last_updated_at = ?
        WHERE account_uuid = ?
      `).run(
        dto.totalTasks,
        dto.activeTasks,
        dto.pausedTasks,
        dto.completedTasks,
        dto.cancelledTasks,
        dto.failedTasks,
        dto.totalExecutions,
        dto.successfulExecutions,
        dto.failedExecutions,
        dto.skippedExecutions,
        dto.timeoutExecutions,
        dto.avgExecutionDuration,
        dto.minExecutionDuration,
        dto.maxExecutionDuration,
        dto.moduleStatistics,
        dto.lastUpdatedAt,
        dto.accountUuid
      );
    } else {
      db.prepare(`
        INSERT INTO schedule_statistics (
          account_uuid,
          total_tasks, active_tasks, paused_tasks, completed_tasks, cancelled_tasks, failed_tasks,
          total_executions, successful_executions, failed_executions, skipped_executions, timeout_executions,
          avg_execution_duration, min_execution_duration, max_execution_duration,
          module_statistics,
          created_at, last_updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        dto.accountUuid,
        dto.totalTasks,
        dto.activeTasks,
        dto.pausedTasks,
        dto.completedTasks,
        dto.cancelledTasks,
        dto.failedTasks,
        dto.totalExecutions,
        dto.successfulExecutions,
        dto.failedExecutions,
        dto.skippedExecutions,
        dto.timeoutExecutions,
        dto.avgExecutionDuration,
        dto.minExecutionDuration,
        dto.maxExecutionDuration,
        dto.moduleStatistics,
        dto.createdAt,
        dto.lastUpdatedAt
      );
    }
  }

  /**
   * 将数据库行映射为实体
   */
  private mapToEntity(row: ScheduleStatisticsRow): ScheduleStatistics {
    return ScheduleStatistics.fromPersistenceDTO({
      id: row.id,
      accountUuid: row.account_uuid,
      totalTasks: row.total_tasks,
      activeTasks: row.active_tasks,
      pausedTasks: row.paused_tasks,
      completedTasks: row.completed_tasks,
      cancelledTasks: row.cancelled_tasks,
      failedTasks: row.failed_tasks,
      totalExecutions: row.total_executions,
      successfulExecutions: row.successful_executions,
      failedExecutions: row.failed_executions,
      skippedExecutions: row.skipped_executions,
      timeoutExecutions: row.timeout_executions,
      avgExecutionDuration: row.avg_execution_duration,
      minExecutionDuration: row.min_execution_duration,
      maxExecutionDuration: row.max_execution_duration,
      moduleStatistics: row.module_statistics,
      createdAt: row.created_at,
      lastUpdatedAt: row.last_updated_at,
    });
  }
}

/**
 * 数据库行类型定义
 */
interface ScheduleStatisticsRow {
  id: number;
  account_uuid: string;
  total_tasks: number;
  active_tasks: number;
  paused_tasks: number;
  completed_tasks: number;
  cancelled_tasks: number;
  failed_tasks: number;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  skipped_executions: number;
  timeout_executions: number;
  avg_execution_duration: number;
  min_execution_duration: number;
  max_execution_duration: number;
  module_statistics: string;
  created_at: number;
  last_updated_at: number;
}
