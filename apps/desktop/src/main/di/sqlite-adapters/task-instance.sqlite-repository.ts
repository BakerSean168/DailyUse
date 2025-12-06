/**
 * SQLite TaskInstance Repository
 *
 * 实现 ITaskInstanceRepository 接口的 SQLite 适配器
 * 遵循 DDD Repository 模式
 */

import type { ITaskInstanceRepository } from '@dailyuse/domain-server/task';
import { TaskInstance } from '@dailyuse/domain-server/task';
import type { TaskInstancePersistenceDTO } from '@dailyuse/contracts/task';
import { TaskInstanceStatus } from '@dailyuse/contracts/task';
import { getDatabase, transaction } from '../../database';

/**
 * TaskInstance SQLite Repository 实现
 */
export class SqliteTaskInstanceRepository implements ITaskInstanceRepository {
  /**
   * 保存任务实例（创建或更新）
   */
  async save(instance: TaskInstance): Promise<void> {
    const db = getDatabase();
    const dto = instance.toPersistenceDTO();

    transaction(() => {
      const existing = db
        .prepare('SELECT uuid FROM task_instances WHERE uuid = ?')
        .get(dto.uuid);

      if (existing) {
        db.prepare(`
          UPDATE task_instances SET
            template_uuid = ?,
            account_uuid = ?,
            instance_date = ?,
            time_config = ?,
            status = ?,
            completion_record = ?,
            skip_record = ?,
            actual_start_time = ?,
            actual_end_time = ?,
            note = ?,
            updated_at = ?
          WHERE uuid = ?
        `).run(
          dto.templateUuid,
          dto.accountUuid,
          dto.instanceDate,
          dto.timeConfig,
          dto.status,
          dto.completionRecord,
          dto.skipRecord,
          dto.actualStartTime,
          dto.actualEndTime,
          dto.note,
          dto.updatedAt,
          dto.uuid
        );
      } else {
        db.prepare(`
          INSERT INTO task_instances (
            uuid, template_uuid, account_uuid, instance_date, time_config,
            status, completion_record, skip_record, actual_start_time, actual_end_time,
            note, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          dto.uuid,
          dto.templateUuid,
          dto.accountUuid,
          dto.instanceDate,
          dto.timeConfig,
          dto.status,
          dto.completionRecord,
          dto.skipRecord,
          dto.actualStartTime,
          dto.actualEndTime,
          dto.note,
          dto.createdAt,
          dto.updatedAt
        );
      }
    });
  }

  /**
   * 批量保存任务实例
   */
  async saveMany(instances: TaskInstance[]): Promise<void> {
    transaction(() => {
      for (const instance of instances) {
        this.saveSync(instance);
      }
    });
  }

  /**
   * 根据 UUID 查找任务实例
   */
  async findByUuid(uuid: string): Promise<TaskInstance | null> {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM task_instances WHERE uuid = ?')
      .get(uuid) as TaskInstanceRow | undefined;

    return row ? this.mapToEntity(row) : null;
  }

  /**
   * 根据模板 UUID 查找任务实例
   */
  async findByTemplate(templateUuid: string): Promise<TaskInstance[]> {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM task_instances WHERE template_uuid = ? ORDER BY instance_date DESC')
      .all(templateUuid) as TaskInstanceRow[];

    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 根据账户 UUID 查找任务实例
   */
  async findByAccount(accountUuid: string): Promise<TaskInstance[]> {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM task_instances WHERE account_uuid = ? ORDER BY instance_date DESC')
      .all(accountUuid) as TaskInstanceRow[];

    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 根据日期范围查找任务实例
   */
  async findByDateRange(accountUuid: string, startDate: number, endDate: number): Promise<TaskInstance[]> {
    const db = getDatabase();
    const rows = db
      .prepare(`
        SELECT * FROM task_instances 
        WHERE account_uuid = ? AND instance_date >= ? AND instance_date <= ?
        ORDER BY instance_date ASC
      `)
      .all(accountUuid, startDate, endDate) as TaskInstanceRow[];

    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 根据状态查找任务实例
   */
  async findByStatus(accountUuid: string, status: TaskInstanceStatus): Promise<TaskInstance[]> {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM task_instances WHERE account_uuid = ? AND status = ? ORDER BY instance_date DESC')
      .all(accountUuid, status) as TaskInstanceRow[];

    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 查找过期的任务实例
   */
  async findOverdueInstances(accountUuid: string): Promise<TaskInstance[]> {
    const db = getDatabase();
    const now = Date.now();

    // 查找状态为 PENDING 且 instance_date 已过期的实例
    const rows = db
      .prepare(`
        SELECT * FROM task_instances 
        WHERE account_uuid = ? 
          AND status = ? 
          AND instance_date < ?
        ORDER BY instance_date ASC
      `)
      .all(accountUuid, 'PENDING', now) as TaskInstanceRow[];

    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 删除任务实例
   */
  async delete(uuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM task_instances WHERE uuid = ?').run(uuid);
  }

  /**
   * 批量删除任务实例
   */
  async deleteMany(uuids: string[]): Promise<void> {
    if (uuids.length === 0) return;

    const db = getDatabase();
    const placeholders = uuids.map(() => '?').join(', ');
    db.prepare(`DELETE FROM task_instances WHERE uuid IN (${placeholders})`).run(...uuids);
  }

  /**
   * 删除模板的所有任务实例
   */
  async deleteByTemplate(templateUuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM task_instances WHERE template_uuid = ?').run(templateUuid);
  }

  /**
   * 统计模板的未过期实例数量
   */
  async countFutureInstances(templateUuid: string, fromDate?: number): Promise<number> {
    const db = getDatabase();
    const date = fromDate ?? Date.now();

    const result = db
      .prepare(`
        SELECT COUNT(*) as count FROM task_instances 
        WHERE template_uuid = ? AND instance_date >= ?
      `)
      .get(templateUuid, date) as { count: number };

    return result.count;
  }

  /**
   * 根据模板 UUID 和日期范围查找任务实例
   */
  async findByTemplateUuidAndDateRange(
    templateUuid: string,
    startDate: number,
    endDate: number
  ): Promise<TaskInstance[]> {
    const db = getDatabase();
    const rows = db
      .prepare(`
        SELECT * FROM task_instances 
        WHERE template_uuid = ? AND instance_date >= ? AND instance_date <= ?
        ORDER BY instance_date ASC
      `)
      .all(templateUuid, startDate, endDate) as TaskInstanceRow[];

    return rows.map((row) => this.mapToEntity(row));
  }

  // ========== 私有辅助方法 ==========

  /**
   * 同步保存任务实例（用于事务）
   */
  private saveSync(instance: TaskInstance): void {
    const db = getDatabase();
    const dto = instance.toPersistenceDTO();

    const existing = db
      .prepare('SELECT uuid FROM task_instances WHERE uuid = ?')
      .get(dto.uuid);

    if (existing) {
      db.prepare(`
        UPDATE task_instances SET
          template_uuid = ?,
          account_uuid = ?,
          instance_date = ?,
          time_config = ?,
          status = ?,
          completion_record = ?,
          skip_record = ?,
          actual_start_time = ?,
          actual_end_time = ?,
          note = ?,
          updated_at = ?
        WHERE uuid = ?
      `).run(
        dto.templateUuid,
        dto.accountUuid,
        dto.instanceDate,
        dto.timeConfig,
        dto.status,
        dto.completionRecord,
        dto.skipRecord,
        dto.actualStartTime,
        dto.actualEndTime,
        dto.note,
        dto.updatedAt,
        dto.uuid
      );
    } else {
      db.prepare(`
        INSERT INTO task_instances (
          uuid, template_uuid, account_uuid, instance_date, time_config,
          status, completion_record, skip_record, actual_start_time, actual_end_time,
          note, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        dto.uuid,
        dto.templateUuid,
        dto.accountUuid,
        dto.instanceDate,
        dto.timeConfig,
        dto.status,
        dto.completionRecord,
        dto.skipRecord,
        dto.actualStartTime,
        dto.actualEndTime,
        dto.note,
        dto.createdAt,
        dto.updatedAt
      );
    }
  }

  /**
   * 将数据库行映射为实体
   */
  private mapToEntity(row: TaskInstanceRow): TaskInstance {
    const dto: TaskInstancePersistenceDTO = {
      uuid: row.uuid,
      templateUuid: row.template_uuid,
      accountUuid: row.account_uuid,
      instanceDate: row.instance_date,
      timeConfig: row.time_config,
      status: row.status,
      completionRecord: row.completion_record,
      skipRecord: row.skip_record,
      actualStartTime: row.actual_start_time,
      actualEndTime: row.actual_end_time,
      note: row.note,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    return TaskInstance.fromPersistenceDTO(dto);
  }
}

// ========== 类型定义 ==========

interface TaskInstanceRow {
  uuid: string;
  template_uuid: string;
  account_uuid: string;
  instance_date: number;
  time_config: string;
  status: string;
  completion_record: string | null;
  skip_record: string | null;
  actual_start_time: number | null;
  actual_end_time: number | null;
  note: string | null;
  created_at: number;
  updated_at: number;
}
