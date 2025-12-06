/**
 * SQLite TaskStatistics Repository
 *
 * 实现 ITaskStatisticsRepository 接口的 SQLite 适配器
 * 遵循 DDD Repository 模式
 */

import type { ITaskStatisticsRepository } from '@dailyuse/domain-server/task';
import { TaskStatistics } from '@dailyuse/domain-server/task';
import type { TaskStatisticsPersistenceDTO } from '@dailyuse/contracts/task';
import { getDatabase, transaction } from '../../database';

/**
 * TaskStatistics SQLite Repository 实现
 */
export class SqliteTaskStatisticsRepository implements ITaskStatisticsRepository {
  /**
   * 保存任务统计数据（创建或更新）
   */
  async save(statistics: TaskStatistics): Promise<void> {
    const db = getDatabase();
    const dto = statistics.toPersistenceDTO();

    transaction(() => {
      const existing = db
        .prepare('SELECT uuid FROM task_statistics WHERE uuid = ?')
        .get(dto.uuid);

      if (existing) {
        db.prepare(`
          UPDATE task_statistics SET
            account_uuid = ?,
            template_total = ?,
            template_active = ?,
            template_paused = ?,
            template_archived = ?,
            template_one_time = ?,
            template_recurring = ?,
            instance_total = ?,
            instance_today = ?,
            instance_week = ?,
            instance_month = ?,
            instance_pending = ?,
            instance_in_progress = ?,
            instance_completed = ?,
            instance_skipped = ?,
            instance_expired = ?,
            completion_today = ?,
            completion_week = ?,
            completion_month = ?,
            completion_total = ?,
            completion_avg_time = ?,
            completion_rate = ?,
            time_all_day = ?,
            time_point = ?,
            time_range = ?,
            time_overdue = ?,
            time_upcoming = ?,
            distribution_by_importance = ?,
            distribution_by_urgency = ?,
            distribution_by_folder = ?,
            distribution_by_tag = ?,
            calculated_at = ?
          WHERE uuid = ?
        `).run(
          dto.accountUuid,
          dto.templateTotal,
          dto.templateActive,
          dto.templatePaused,
          dto.templateArchived,
          dto.templateOneTime,
          dto.templateRecurring,
          dto.instanceTotal,
          dto.instanceToday,
          dto.instanceWeek,
          dto.instanceMonth,
          dto.instancePending,
          dto.instanceInProgress,
          dto.instanceCompleted,
          dto.instanceSkipped,
          dto.instanceExpired,
          dto.completionToday,
          dto.completionWeek,
          dto.completionMonth,
          dto.completionTotal,
          dto.completionAvgTime,
          dto.completionRate,
          dto.timeAllDay,
          dto.timePoint,
          dto.timeRange,
          dto.timeOverdue,
          dto.timeUpcoming,
          dto.distributionByImportance,
          dto.distributionByUrgency,
          dto.distributionByFolder,
          dto.distributionByTag,
          dto.calculatedAt,
          dto.uuid
        );
      } else {
        db.prepare(`
          INSERT INTO task_statistics (
            uuid, account_uuid,
            template_total, template_active, template_paused, template_archived,
            template_one_time, template_recurring,
            instance_total, instance_today, instance_week, instance_month,
            instance_pending, instance_in_progress, instance_completed, instance_skipped, instance_expired,
            completion_today, completion_week, completion_month, completion_total,
            completion_avg_time, completion_rate,
            time_all_day, time_point, time_range, time_overdue, time_upcoming,
            distribution_by_importance, distribution_by_urgency, distribution_by_folder, distribution_by_tag,
            calculated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          dto.uuid,
          dto.accountUuid,
          dto.templateTotal,
          dto.templateActive,
          dto.templatePaused,
          dto.templateArchived,
          dto.templateOneTime,
          dto.templateRecurring,
          dto.instanceTotal,
          dto.instanceToday,
          dto.instanceWeek,
          dto.instanceMonth,
          dto.instancePending,
          dto.instanceInProgress,
          dto.instanceCompleted,
          dto.instanceSkipped,
          dto.instanceExpired,
          dto.completionToday,
          dto.completionWeek,
          dto.completionMonth,
          dto.completionTotal,
          dto.completionAvgTime,
          dto.completionRate,
          dto.timeAllDay,
          dto.timePoint,
          dto.timeRange,
          dto.timeOverdue,
          dto.timeUpcoming,
          dto.distributionByImportance,
          dto.distributionByUrgency,
          dto.distributionByFolder,
          dto.distributionByTag,
          dto.calculatedAt
        );
      }
    });
  }

  /**
   * 根据 UUID 查找任务统计
   */
  async findByUuid(uuid: string): Promise<TaskStatistics | null> {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM task_statistics WHERE uuid = ?')
      .get(uuid) as TaskStatisticsRow | undefined;

    return row ? this.mapToEntity(row) : null;
  }

  /**
   * 根据账户 UUID 查找任务统计
   */
  async findByAccountUuid(accountUuid: string): Promise<TaskStatistics | null> {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM task_statistics WHERE account_uuid = ? ORDER BY calculated_at DESC LIMIT 1')
      .get(accountUuid) as TaskStatisticsRow | undefined;

    return row ? this.mapToEntity(row) : null;
  }

  /**
   * 删除任务统计
   */
  async delete(uuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM task_statistics WHERE uuid = ?').run(uuid);
  }

  /**
   * 批量保存统计数据
   */
  async saveBatch(statisticsList: TaskStatistics[]): Promise<void> {
    transaction(() => {
      for (const statistics of statisticsList) {
        this.saveSync(statistics);
      }
    });
  }

  // ========== 私有辅助方法 ==========

  /**
   * 同步保存任务统计（用于事务）
   */
  private saveSync(statistics: TaskStatistics): void {
    const db = getDatabase();
    const dto = statistics.toPersistenceDTO();

    const existing = db
      .prepare('SELECT uuid FROM task_statistics WHERE uuid = ?')
      .get(dto.uuid);

    if (existing) {
      db.prepare(`
        UPDATE task_statistics SET
          account_uuid = ?,
          template_total = ?,
          template_active = ?,
          template_paused = ?,
          template_archived = ?,
          template_one_time = ?,
          template_recurring = ?,
          instance_total = ?,
          instance_today = ?,
          instance_week = ?,
          instance_month = ?,
          instance_pending = ?,
          instance_in_progress = ?,
          instance_completed = ?,
          instance_skipped = ?,
          instance_expired = ?,
          completion_today = ?,
          completion_week = ?,
          completion_month = ?,
          completion_total = ?,
          completion_avg_time = ?,
          completion_rate = ?,
          time_all_day = ?,
          time_point = ?,
          time_range = ?,
          time_overdue = ?,
          time_upcoming = ?,
          distribution_by_importance = ?,
          distribution_by_urgency = ?,
          distribution_by_folder = ?,
          distribution_by_tag = ?,
          calculated_at = ?
        WHERE uuid = ?
      `).run(
        dto.accountUuid,
        dto.templateTotal,
        dto.templateActive,
        dto.templatePaused,
        dto.templateArchived,
        dto.templateOneTime,
        dto.templateRecurring,
        dto.instanceTotal,
        dto.instanceToday,
        dto.instanceWeek,
        dto.instanceMonth,
        dto.instancePending,
        dto.instanceInProgress,
        dto.instanceCompleted,
        dto.instanceSkipped,
        dto.instanceExpired,
        dto.completionToday,
        dto.completionWeek,
        dto.completionMonth,
        dto.completionTotal,
        dto.completionAvgTime,
        dto.completionRate,
        dto.timeAllDay,
        dto.timePoint,
        dto.timeRange,
        dto.timeOverdue,
        dto.timeUpcoming,
        dto.distributionByImportance,
        dto.distributionByUrgency,
        dto.distributionByFolder,
        dto.distributionByTag,
        dto.calculatedAt,
        dto.uuid
      );
    } else {
      db.prepare(`
        INSERT INTO task_statistics (
          uuid, account_uuid,
          template_total, template_active, template_paused, template_archived,
          template_one_time, template_recurring,
          instance_total, instance_today, instance_week, instance_month,
          instance_pending, instance_in_progress, instance_completed, instance_skipped, instance_expired,
          completion_today, completion_week, completion_month, completion_total,
          completion_avg_time, completion_rate,
          time_all_day, time_point, time_range, time_overdue, time_upcoming,
          distribution_by_importance, distribution_by_urgency, distribution_by_folder, distribution_by_tag,
          calculated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        dto.uuid,
        dto.accountUuid,
        dto.templateTotal,
        dto.templateActive,
        dto.templatePaused,
        dto.templateArchived,
        dto.templateOneTime,
        dto.templateRecurring,
        dto.instanceTotal,
        dto.instanceToday,
        dto.instanceWeek,
        dto.instanceMonth,
        dto.instancePending,
        dto.instanceInProgress,
        dto.instanceCompleted,
        dto.instanceSkipped,
        dto.instanceExpired,
        dto.completionToday,
        dto.completionWeek,
        dto.completionMonth,
        dto.completionTotal,
        dto.completionAvgTime,
        dto.completionRate,
        dto.timeAllDay,
        dto.timePoint,
        dto.timeRange,
        dto.timeOverdue,
        dto.timeUpcoming,
        dto.distributionByImportance,
        dto.distributionByUrgency,
        dto.distributionByFolder,
        dto.distributionByTag,
        dto.calculatedAt
      );
    }
  }

  /**
   * 将数据库行映射为实体
   */
  private mapToEntity(row: TaskStatisticsRow): TaskStatistics {
    const dto: TaskStatisticsPersistenceDTO = {
      uuid: row.uuid,
      accountUuid: row.account_uuid,
      templateTotal: row.template_total,
      templateActive: row.template_active,
      templatePaused: row.template_paused,
      templateArchived: row.template_archived,
      templateOneTime: row.template_one_time,
      templateRecurring: row.template_recurring,
      instanceTotal: row.instance_total,
      instanceToday: row.instance_today,
      instanceWeek: row.instance_week,
      instanceMonth: row.instance_month,
      instancePending: row.instance_pending,
      instanceInProgress: row.instance_in_progress,
      instanceCompleted: row.instance_completed,
      instanceSkipped: row.instance_skipped,
      instanceExpired: row.instance_expired,
      completionToday: row.completion_today,
      completionWeek: row.completion_week,
      completionMonth: row.completion_month,
      completionTotal: row.completion_total,
      completionAvgTime: row.completion_avg_time,
      completionRate: row.completion_rate,
      timeAllDay: row.time_all_day,
      timePoint: row.time_point,
      timeRange: row.time_range,
      timeOverdue: row.time_overdue,
      timeUpcoming: row.time_upcoming,
      distributionByImportance: row.distribution_by_importance,
      distributionByUrgency: row.distribution_by_urgency,
      distributionByFolder: row.distribution_by_folder,
      distributionByTag: row.distribution_by_tag,
      calculatedAt: row.calculated_at,
    };

    return TaskStatistics.fromPersistenceDTO(dto);
  }
}

// ========== 类型定义 ==========

interface TaskStatisticsRow {
  uuid: string;
  account_uuid: string;
  template_total: number;
  template_active: number;
  template_paused: number;
  template_archived: number;
  template_one_time: number;
  template_recurring: number;
  instance_total: number;
  instance_today: number;
  instance_week: number;
  instance_month: number;
  instance_pending: number;
  instance_in_progress: number;
  instance_completed: number;
  instance_skipped: number;
  instance_expired: number;
  completion_today: number;
  completion_week: number;
  completion_month: number;
  completion_total: number;
  completion_avg_time: number | null;
  completion_rate: number;
  time_all_day: number;
  time_point: number;
  time_range: number;
  time_overdue: number;
  time_upcoming: number;
  distribution_by_importance: string;
  distribution_by_urgency: string;
  distribution_by_folder: string;
  distribution_by_tag: string;
  calculated_at: number;
}
