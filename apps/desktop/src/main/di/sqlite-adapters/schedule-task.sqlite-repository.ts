/**
 * SQLite ScheduleTask Repository
 *
 * 实现 IScheduleTaskRepository 接口的 SQLite 适配器
 * 遵循 DDD Repository 模式
 */

import type {
  IScheduleTaskRepository,
  IScheduleTaskQueryOptions,
} from '@dailyuse/domain-server/schedule';
import { ScheduleTask } from '@dailyuse/domain-server/schedule';
import type { ScheduleTaskPersistenceDTO } from '@dailyuse/contracts/schedule';
import { ScheduleTaskStatus, SourceModule } from '@dailyuse/contracts/schedule';
import { getDatabase, transaction } from '../../database';

/**
 * ScheduleTask SQLite Repository 实现
 */
export class SqliteScheduleTaskRepository implements IScheduleTaskRepository {
  // ============ 基本 CRUD ============

  /**
   * 保存 ScheduleTask 聚合根（创建或更新）
   */
  async save(task: ScheduleTask): Promise<void> {
    const db = getDatabase();
    const dto = task.toPersistenceDTO();

    transaction(() => {
      const existing = db
        .prepare('SELECT uuid FROM schedule_tasks WHERE uuid = ?')
        .get(dto.uuid);

      if (existing) {
        db.prepare(`
          UPDATE schedule_tasks SET
            account_uuid = ?,
            name = ?,
            description = ?,
            source_module = ?,
            source_entity_id = ?,
            status = ?,
            enabled = ?,
            cron_expression = ?,
            timezone = ?,
            start_date = ?,
            end_date = ?,
            max_executions = ?,
            next_run_at = ?,
            last_run_at = ?,
            execution_count = ?,
            last_execution_status = ?,
            last_execution_duration = ?,
            consecutive_failures = ?,
            max_retries = ?,
            initial_delay_ms = ?,
            max_delay_ms = ?,
            backoff_multiplier = ?,
            retryable_statuses = ?,
            payload = ?,
            tags = ?,
            priority = ?,
            timeout = ?,
            updated_at = ?
          WHERE uuid = ?
        `).run(
          dto.accountUuid,
          dto.name,
          dto.description,
          dto.sourceModule,
          dto.sourceEntityId,
          dto.status,
          dto.enabled ? 1 : 0,
          dto.cronExpression,
          dto.timezone,
          dto.startDate,
          dto.endDate,
          dto.maxExecutions,
          dto.nextRunAt,
          dto.lastRunAt,
          dto.executionCount,
          dto.lastExecutionStatus,
          dto.lastExecutionDuration,
          dto.consecutiveFailures,
          dto.maxRetries,
          dto.initialDelayMs,
          dto.maxDelayMs,
          dto.backoffMultiplier,
          dto.retryableStatuses,
          typeof dto.payload === 'string' ? dto.payload : JSON.stringify(dto.payload),
          dto.tags,
          dto.priority,
          dto.timeout,
          dto.updatedAt,
          dto.uuid
        );
      } else {
        db.prepare(`
          INSERT INTO schedule_tasks (
            uuid, account_uuid, name, description,
            source_module, source_entity_id, status, enabled,
            cron_expression, timezone, start_date, end_date, max_executions,
            next_run_at, last_run_at, execution_count, last_execution_status,
            last_execution_duration, consecutive_failures,
            max_retries, initial_delay_ms, max_delay_ms, backoff_multiplier, retryable_statuses,
            payload, tags, priority, timeout,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          dto.uuid,
          dto.accountUuid,
          dto.name,
          dto.description,
          dto.sourceModule,
          dto.sourceEntityId,
          dto.status,
          dto.enabled ? 1 : 0,
          dto.cronExpression,
          dto.timezone,
          dto.startDate,
          dto.endDate,
          dto.maxExecutions,
          dto.nextRunAt,
          dto.lastRunAt,
          dto.executionCount,
          dto.lastExecutionStatus,
          dto.lastExecutionDuration,
          dto.consecutiveFailures,
          dto.maxRetries,
          dto.initialDelayMs,
          dto.maxDelayMs,
          dto.backoffMultiplier,
          dto.retryableStatuses,
          typeof dto.payload === 'string' ? dto.payload : JSON.stringify(dto.payload),
          dto.tags,
          dto.priority,
          dto.timeout,
          dto.createdAt,
          dto.updatedAt
        );
      }
    });
  }

  /**
   * 根据 UUID 查找 ScheduleTask
   */
  async findByUuid(uuid: string): Promise<ScheduleTask | null> {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM schedule_tasks WHERE uuid = ?')
      .get(uuid) as ScheduleTaskRow | undefined;

    if (!row) {
      return null;
    }

    return this.mapToEntity(row);
  }

  /**
   * 根据 UUID 删除 ScheduleTask
   */
  async deleteByUuid(uuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM schedule_tasks WHERE uuid = ?').run(uuid);
  }

  // ============ 查询方法 ============

  /**
   * 查询账户下的所有任务
   */
  async findByAccountUuid(accountUuid: string): Promise<ScheduleTask[]> {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM schedule_tasks WHERE account_uuid = ?')
      .all(accountUuid) as ScheduleTaskRow[];

    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 查询指定来源模块的所有任务
   */
  async findBySourceModule(
    module: SourceModule,
    accountUuid?: string
  ): Promise<ScheduleTask[]> {
    const db = getDatabase();
    let query = 'SELECT * FROM schedule_tasks WHERE source_module = ?';
    const params: any[] = [module];

    if (accountUuid) {
      query += ' AND account_uuid = ?';
      params.push(accountUuid);
    }

    const rows = db.prepare(query).all(...params) as ScheduleTaskRow[];
    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 查询指定来源实体的任务
   */
  async findBySourceEntity(
    module: SourceModule,
    entityId: string,
    accountUuid?: string
  ): Promise<ScheduleTask[]> {
    const db = getDatabase();
    let query =
      'SELECT * FROM schedule_tasks WHERE source_module = ? AND source_entity_id = ?';
    const params: any[] = [module, entityId];

    if (accountUuid) {
      query += ' AND account_uuid = ?';
      params.push(accountUuid);
    }

    const rows = db.prepare(query).all(...params) as ScheduleTaskRow[];
    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 查询指定状态的任务
   */
  async findByStatus(
    status: ScheduleTaskStatus,
    accountUuid?: string
  ): Promise<ScheduleTask[]> {
    const db = getDatabase();
    let query = 'SELECT * FROM schedule_tasks WHERE status = ?';
    const params: any[] = [status];

    if (accountUuid) {
      query += ' AND account_uuid = ?';
      params.push(accountUuid);
    }

    const rows = db.prepare(query).all(...params) as ScheduleTaskRow[];
    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 查询启用的任务
   */
  async findEnabled(accountUuid?: string): Promise<ScheduleTask[]> {
    const db = getDatabase();
    let query = 'SELECT * FROM schedule_tasks WHERE enabled = 1';
    const params: any[] = [];

    if (accountUuid) {
      query += ' AND account_uuid = ?';
      params.push(accountUuid);
    }

    const rows = db.prepare(query).all(...params) as ScheduleTaskRow[];
    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 查询需要执行的任务 (到时间 + 已启用 + 活跃状态)
   */
  async findDueTasksForExecution(
    beforeTime: Date,
    limit: number = 100
  ): Promise<ScheduleTask[]> {
    const db = getDatabase();
    const query = `
      SELECT * FROM schedule_tasks
      WHERE enabled = 1
        AND status = ?
        AND next_run_at IS NOT NULL
        AND next_run_at <= ?
      ORDER BY next_run_at ASC
      LIMIT ?
    `;

    const rows = db
      .prepare(query)
      .all(ScheduleTaskStatus.ACTIVE, beforeTime.getTime(), limit) as ScheduleTaskRow[];

    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 高级查询
   */
  async query(options: IScheduleTaskQueryOptions): Promise<ScheduleTask[]> {
    const db = getDatabase();
    const conditions: string[] = [];
    const params: any[] = [];

    if (options.accountUuid) {
      conditions.push('account_uuid = ?');
      params.push(options.accountUuid);
    }

    if (options.sourceModule) {
      conditions.push('source_module = ?');
      params.push(options.sourceModule);
    }

    if (options.sourceEntityId) {
      conditions.push('source_entity_id = ?');
      params.push(options.sourceEntityId);
    }

    if (options.status) {
      conditions.push('status = ?');
      params.push(options.status);
    }

    if (options.isEnabled !== undefined) {
      conditions.push('enabled = ?');
      params.push(options.isEnabled ? 1 : 0);
    }

    let query = 'SELECT * FROM schedule_tasks';
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }

    if (options.offset) {
      query += ' OFFSET ?';
      params.push(options.offset);
    }

    const rows = db.prepare(query).all(...params) as ScheduleTaskRow[];
    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 计数查询
   */
  async count(options: IScheduleTaskQueryOptions): Promise<number> {
    const db = getDatabase();
    const conditions: string[] = [];
    const params: any[] = [];

    if (options.accountUuid) {
      conditions.push('account_uuid = ?');
      params.push(options.accountUuid);
    }

    if (options.sourceModule) {
      conditions.push('source_module = ?');
      params.push(options.sourceModule);
    }

    if (options.sourceEntityId) {
      conditions.push('source_entity_id = ?');
      params.push(options.sourceEntityId);
    }

    if (options.status) {
      conditions.push('status = ?');
      params.push(options.status);
    }

    if (options.isEnabled !== undefined) {
      conditions.push('enabled = ?');
      params.push(options.isEnabled ? 1 : 0);
    }

    let query = 'SELECT COUNT(*) as count FROM schedule_tasks';
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const result = db.prepare(query).get(...params) as { count: number };
    return result.count;
  }

  // ============ 批量操作 ============

  /**
   * 批量保存
   */
  async saveBatch(tasks: ScheduleTask[]): Promise<void> {
    transaction(() => {
      for (const task of tasks) {
        // 使用同步版本避免 Promise 在事务中的问题
        this.saveSync(task);
      }
    });
  }

  /**
   * 批量删除
   */
  async deleteBatch(uuids: string[]): Promise<void> {
    if (uuids.length === 0) return;

    const db = getDatabase();
    const placeholders = uuids.map(() => '?').join(',');
    
    transaction(() => {
      db.prepare(`DELETE FROM schedule_tasks WHERE uuid IN (${placeholders})`).run(
        ...uuids
      );
    });
  }

  // ============ 事务支持 ============

  /**
   * 在事务中执行操作
   */
  async withTransaction<T>(
    fn: (repo: IScheduleTaskRepository) => Promise<T>
  ): Promise<T> {
    return transaction(() => {
      // 创建一个事务内的仓储实例
      const txRepo = new SqliteScheduleTaskRepository();
      // 注意：这里需要使用同步方式或特殊处理
      // 因为 better-sqlite3 的事务是同步的
      // 这里简化处理，直接调用
      return fn(txRepo);
    }) as T;
  }

  // ============ 私有方法 ============

  /**
   * 同步保存（用于事务内）
   */
  private saveSync(task: ScheduleTask): void {
    const db = getDatabase();
    const dto = task.toPersistenceDTO();

    const existing = db
      .prepare('SELECT uuid FROM schedule_tasks WHERE uuid = ?')
      .get(dto.uuid);

    if (existing) {
      db.prepare(`
        UPDATE schedule_tasks SET
          account_uuid = ?,
          name = ?,
          description = ?,
          source_module = ?,
          source_entity_id = ?,
          status = ?,
          enabled = ?,
          cron_expression = ?,
          timezone = ?,
          start_date = ?,
          end_date = ?,
          max_executions = ?,
          next_run_at = ?,
          last_run_at = ?,
          execution_count = ?,
          last_execution_status = ?,
          last_execution_duration = ?,
          consecutive_failures = ?,
          max_retries = ?,
          initial_delay_ms = ?,
          max_delay_ms = ?,
          backoff_multiplier = ?,
          retryable_statuses = ?,
          payload = ?,
          tags = ?,
          priority = ?,
          timeout = ?,
          updated_at = ?
        WHERE uuid = ?
      `).run(
        dto.accountUuid,
        dto.name,
        dto.description,
        dto.sourceModule,
        dto.sourceEntityId,
        dto.status,
        dto.enabled ? 1 : 0,
        dto.cronExpression,
        dto.timezone,
        dto.startDate,
        dto.endDate,
        dto.maxExecutions,
        dto.nextRunAt,
        dto.lastRunAt,
        dto.executionCount,
        dto.lastExecutionStatus,
        dto.lastExecutionDuration,
        dto.consecutiveFailures,
        dto.maxRetries,
        dto.initialDelayMs,
        dto.maxDelayMs,
        dto.backoffMultiplier,
        dto.retryableStatuses,
        typeof dto.payload === 'string' ? dto.payload : JSON.stringify(dto.payload),
        dto.tags,
        dto.priority,
        dto.timeout,
        dto.updatedAt,
        dto.uuid
      );
    } else {
      db.prepare(`
        INSERT INTO schedule_tasks (
          uuid, account_uuid, name, description,
          source_module, source_entity_id, status, enabled,
          cron_expression, timezone, start_date, end_date, max_executions,
          next_run_at, last_run_at, execution_count, last_execution_status,
          last_execution_duration, consecutive_failures,
          max_retries, initial_delay_ms, max_delay_ms, backoff_multiplier, retryable_statuses,
          payload, tags, priority, timeout,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        dto.uuid,
        dto.accountUuid,
        dto.name,
        dto.description,
        dto.sourceModule,
        dto.sourceEntityId,
        dto.status,
        dto.enabled ? 1 : 0,
        dto.cronExpression,
        dto.timezone,
        dto.startDate,
        dto.endDate,
        dto.maxExecutions,
        dto.nextRunAt,
        dto.lastRunAt,
        dto.executionCount,
        dto.lastExecutionStatus,
        dto.lastExecutionDuration,
        dto.consecutiveFailures,
        dto.maxRetries,
        dto.initialDelayMs,
        dto.maxDelayMs,
        dto.backoffMultiplier,
        dto.retryableStatuses,
        typeof dto.payload === 'string' ? dto.payload : JSON.stringify(dto.payload),
        dto.tags,
        dto.priority,
        dto.timeout,
        dto.createdAt,
        dto.updatedAt
      );
    }
  }

  /**
   * 将数据库行映射为实体
   */
  private mapToEntity(row: ScheduleTaskRow): ScheduleTask {
    return ScheduleTask.fromPersistenceDTO({
      uuid: row.uuid,
      accountUuid: row.account_uuid,
      name: row.name,
      description: row.description,
      sourceModule: row.source_module as SourceModule,
      sourceEntityId: row.source_entity_id,
      status: row.status as ScheduleTaskStatus,
      enabled: row.enabled === 1,
      cronExpression: row.cron_expression,
      timezone: row.timezone,
      startDate: row.start_date,
      endDate: row.end_date,
      maxExecutions: row.max_executions,
      nextRunAt: row.next_run_at,
      lastRunAt: row.last_run_at,
      executionCount: row.execution_count,
      lastExecutionStatus: row.last_execution_status,
      lastExecutionDuration: row.last_execution_duration,
      consecutiveFailures: row.consecutive_failures,
      maxRetries: row.max_retries,
      initialDelayMs: row.initial_delay_ms,
      maxDelayMs: row.max_delay_ms,
      backoffMultiplier: row.backoff_multiplier,
      retryableStatuses: row.retryable_statuses,
      payload: row.payload ? JSON.parse(row.payload) : null,
      tags: row.tags,
      priority: row.priority,
      timeout: row.timeout,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}

/**
 * 数据库行类型定义
 */
interface ScheduleTaskRow {
  uuid: string;
  account_uuid: string;
  name: string;
  description: string | null;
  source_module: string;
  source_entity_id: string;
  status: string;
  enabled: number; // SQLite boolean (0 or 1)
  cron_expression: string | null;
  timezone: string;
  start_date: number | null;
  end_date: number | null;
  max_executions: number | null;
  next_run_at: number | null;
  last_run_at: number | null;
  execution_count: number;
  last_execution_status: string | null;
  last_execution_duration: number | null;
  consecutive_failures: number;
  max_retries: number;
  initial_delay_ms: number;
  max_delay_ms: number;
  backoff_multiplier: number;
  retryable_statuses: string;
  payload: string | null;
  tags: string;
  priority: string;
  timeout: number | null;
  created_at: number;
  updated_at: number;
}
