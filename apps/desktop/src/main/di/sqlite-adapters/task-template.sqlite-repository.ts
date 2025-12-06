/**
 * SQLite TaskTemplate Repository
 *
 * 实现 ITaskTemplateRepository 接口的 SQLite 适配器
 * 遵循 DDD Repository 模式
 */

import type { ITaskTemplateRepository, TaskFilters } from '@dailyuse/domain-server/task';
import { TaskTemplate } from '@dailyuse/domain-server/task';
import type { TaskTemplatePersistenceDTO } from '@dailyuse/contracts/task';
import { TaskTemplateStatus, TaskType } from '@dailyuse/contracts/task';
import { getDatabase, transaction } from '../../database';

/**
 * TaskTemplate SQLite Repository 实现
 */
export class SqliteTaskTemplateRepository implements ITaskTemplateRepository {
  /**
   * 保存任务模板（创建或更新）
   */
  async save(template: TaskTemplate): Promise<void> {
    const db = getDatabase();
    const dto = template.toPersistenceDTO();

    transaction(() => {
      const existing = db
        .prepare('SELECT uuid FROM task_templates WHERE uuid = ?')
        .get(dto.uuid);

      if (existing) {
        db.prepare(`
          UPDATE task_templates SET
            account_uuid = ?,
            title = ?,
            description = ?,
            task_type = ?,
            time_config_type = ?,
            time_config_start_time = ?,
            time_config_end_time = ?,
            time_config_duration_minutes = ?,
            recurrence_rule_type = ?,
            recurrence_rule_interval = ?,
            recurrence_rule_days_of_week = ?,
            recurrence_rule_day_of_month = ?,
            recurrence_rule_month_of_year = ?,
            recurrence_rule_end_date = ?,
            recurrence_rule_count = ?,
            reminder_config_enabled = ?,
            reminder_config_time_offset_minutes = ?,
            reminder_config_unit = ?,
            reminder_config_channel = ?,
            importance = ?,
            urgency = ?,
            goal_binding_goal_uuid = ?,
            goal_binding_key_result_uuid = ?,
            goal_binding_increment_value = ?,
            folder_uuid = ?,
            tags = ?,
            color = ?,
            status = ?,
            last_generated_date = ?,
            generate_ahead_days = ?,
            goal_uuid = ?,
            key_result_uuid = ?,
            parent_task_uuid = ?,
            start_date = ?,
            due_date = ?,
            completed_at = ?,
            estimated_minutes = ?,
            actual_minutes = ?,
            note = ?,
            dependency_status = ?,
            is_blocked = ?,
            blocking_reason = ?,
            updated_at = ?,
            deleted_at = ?
          WHERE uuid = ?
        `).run(
          dto.accountUuid,
          dto.title,
          dto.description,
          dto.taskType,
          dto.timeConfigType,
          dto.timeConfigStartTime,
          dto.timeConfigEndTime,
          dto.timeConfigDurationMinutes,
          dto.recurrenceRuleType,
          dto.recurrenceRuleInterval,
          dto.recurrenceRuleDaysOfWeek,
          dto.recurrenceRuleDayOfMonth,
          dto.recurrenceRuleMonthOfYear,
          dto.recurrenceRuleEndDate,
          dto.recurrenceRuleCount,
          dto.reminderConfigEnabled ? 1 : 0,
          dto.reminderConfigTimeOffsetMinutes,
          dto.reminderConfigUnit,
          dto.reminderConfigChannel,
          dto.importance,
          dto.urgency,
          dto.goalBindingGoalUuid,
          dto.goalBindingKeyResultUuid,
          dto.goalBindingIncrementValue,
          dto.folderUuid,
          dto.tags,
          dto.color,
          dto.status,
          dto.lastGeneratedDate,
          dto.generateAheadDays,
          dto.goalUuid,
          dto.keyResultUuid,
          dto.parentTaskUuid,
          dto.startDate,
          dto.dueDate,
          dto.completedAt,
          dto.estimatedMinutes,
          dto.actualMinutes,
          dto.note,
          dto.dependencyStatus,
          dto.isBlocked ? 1 : 0,
          dto.blockingReason,
          dto.updatedAt,
          dto.deletedAt,
          dto.uuid
        );
      } else {
        db.prepare(`
          INSERT INTO task_templates (
            uuid, account_uuid, title, description, task_type,
            time_config_type, time_config_start_time, time_config_end_time, time_config_duration_minutes,
            recurrence_rule_type, recurrence_rule_interval, recurrence_rule_days_of_week,
            recurrence_rule_day_of_month, recurrence_rule_month_of_year, recurrence_rule_end_date, recurrence_rule_count,
            reminder_config_enabled, reminder_config_time_offset_minutes, reminder_config_unit, reminder_config_channel,
            importance, urgency,
            goal_binding_goal_uuid, goal_binding_key_result_uuid, goal_binding_increment_value,
            folder_uuid, tags, color, status, last_generated_date, generate_ahead_days,
            goal_uuid, key_result_uuid, parent_task_uuid, start_date, due_date, completed_at,
            estimated_minutes, actual_minutes, note,
            dependency_status, is_blocked, blocking_reason,
            created_at, updated_at, deleted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          dto.uuid,
          dto.accountUuid,
          dto.title,
          dto.description,
          dto.taskType,
          dto.timeConfigType,
          dto.timeConfigStartTime,
          dto.timeConfigEndTime,
          dto.timeConfigDurationMinutes,
          dto.recurrenceRuleType,
          dto.recurrenceRuleInterval,
          dto.recurrenceRuleDaysOfWeek,
          dto.recurrenceRuleDayOfMonth,
          dto.recurrenceRuleMonthOfYear,
          dto.recurrenceRuleEndDate,
          dto.recurrenceRuleCount,
          dto.reminderConfigEnabled ? 1 : 0,
          dto.reminderConfigTimeOffsetMinutes,
          dto.reminderConfigUnit,
          dto.reminderConfigChannel,
          dto.importance,
          dto.urgency,
          dto.goalBindingGoalUuid,
          dto.goalBindingKeyResultUuid,
          dto.goalBindingIncrementValue,
          dto.folderUuid,
          dto.tags,
          dto.color,
          dto.status,
          dto.lastGeneratedDate,
          dto.generateAheadDays,
          dto.goalUuid,
          dto.keyResultUuid,
          dto.parentTaskUuid,
          dto.startDate,
          dto.dueDate,
          dto.completedAt,
          dto.estimatedMinutes,
          dto.actualMinutes,
          dto.note,
          dto.dependencyStatus,
          dto.isBlocked ? 1 : 0,
          dto.blockingReason,
          dto.createdAt,
          dto.updatedAt,
          dto.deletedAt
        );
      }
    });
  }

  /**
   * 根据 UUID 查找任务模板
   */
  async findByUuid(uuid: string): Promise<TaskTemplate | null> {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM task_templates WHERE uuid = ? AND deleted_at IS NULL')
      .get(uuid) as TaskTemplateRow | undefined;

    return row ? this.mapToEntity(row) : null;
  }

  /**
   * 根据 UUID 查找任务模板（包含子实体）
   */
  async findByUuidWithChildren(uuid: string): Promise<TaskTemplate | null> {
    // 目前与 findByUuid 相同，子实体加载在 TaskInstance 仓储中处理
    return this.findByUuid(uuid);
  }

  /**
   * 根据账户 UUID 查找任务模板
   */
  async findByAccount(accountUuid: string): Promise<TaskTemplate[]> {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM task_templates WHERE account_uuid = ? AND deleted_at IS NULL ORDER BY created_at DESC')
      .all(accountUuid) as TaskTemplateRow[];

    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 根据状态查找任务模板
   */
  async findByStatus(accountUuid: string, status: TaskTemplateStatus): Promise<TaskTemplate[]> {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM task_templates WHERE account_uuid = ? AND status = ? AND deleted_at IS NULL ORDER BY created_at DESC')
      .all(accountUuid, status) as TaskTemplateRow[];

    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 查找活跃的任务模板
   */
  async findActiveTemplates(accountUuid: string): Promise<TaskTemplate[]> {
    return this.findByStatus(accountUuid, TaskTemplateStatus.ACTIVE);
  }

  /**
   * 根据文件夹查找任务模板
   */
  async findByFolder(folderUuid: string): Promise<TaskTemplate[]> {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM task_templates WHERE folder_uuid = ? AND deleted_at IS NULL ORDER BY created_at DESC')
      .all(folderUuid) as TaskTemplateRow[];

    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 根据目标查找任务模板
   */
  async findByGoal(goalUuid: string): Promise<TaskTemplate[]> {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM task_templates WHERE (goal_uuid = ? OR goal_binding_goal_uuid = ?) AND deleted_at IS NULL ORDER BY created_at DESC')
      .all(goalUuid, goalUuid) as TaskTemplateRow[];

    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 根据标签查找任务模板
   */
  async findByTags(accountUuid: string, tags: string[]): Promise<TaskTemplate[]> {
    const db = getDatabase();
    // 使用 JSON 查询匹配标签
    const rows = db
      .prepare('SELECT * FROM task_templates WHERE account_uuid = ? AND deleted_at IS NULL ORDER BY created_at DESC')
      .all(accountUuid) as TaskTemplateRow[];

    return rows
      .filter((row) => {
        const rowTags: string[] = row.tags ? JSON.parse(row.tags) : [];
        return tags.some((tag) => rowTags.includes(tag));
      })
      .map((row) => this.mapToEntity(row));
  }

  /**
   * 查找需要生成实例的模板
   */
  async findNeedGenerateInstances(toDate: number): Promise<TaskTemplate[]> {
    const db = getDatabase();
    const rows = db
      .prepare(`
        SELECT * FROM task_templates 
        WHERE task_type = ? 
          AND status = ? 
          AND deleted_at IS NULL 
          AND (last_generated_date IS NULL OR last_generated_date < ?)
        ORDER BY created_at DESC
      `)
      .all(TaskType.RECURRING, TaskTemplateStatus.ACTIVE, toDate) as TaskTemplateRow[];

    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 删除任务模板
   */
  async delete(uuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM task_templates WHERE uuid = ?').run(uuid);
  }

  /**
   * 软删除任务模板
   */
  async softDelete(uuid: string): Promise<void> {
    const db = getDatabase();
    const now = Date.now();
    db.prepare('UPDATE task_templates SET deleted_at = ?, updated_at = ? WHERE uuid = ?').run(now, now, uuid);
  }

  /**
   * 恢复任务模板
   */
  async restore(uuid: string): Promise<void> {
    const db = getDatabase();
    const now = Date.now();
    db.prepare('UPDATE task_templates SET deleted_at = NULL, updated_at = ? WHERE uuid = ?').run(now, uuid);
  }

  /**
   * 查找一次性任务（带过滤器）
   */
  async findOneTimeTasks(accountUuid: string, filters?: TaskFilters): Promise<TaskTemplate[]> {
    return this.findTasksByType(accountUuid, TaskType.ONE_TIME, filters);
  }

  /**
   * 查找循环任务（带过滤器）
   */
  async findRecurringTasks(accountUuid: string, filters?: TaskFilters): Promise<TaskTemplate[]> {
    return this.findTasksByType(accountUuid, TaskType.RECURRING, filters);
  }

  /**
   * 查找逾期的任务
   */
  async findOverdueTasks(accountUuid: string): Promise<TaskTemplate[]> {
    const db = getDatabase();
    const now = Date.now();
    const rows = db
      .prepare(`
        SELECT * FROM task_templates 
        WHERE account_uuid = ? 
          AND task_type = ? 
          AND due_date < ? 
          AND status = ?
          AND deleted_at IS NULL 
        ORDER BY due_date ASC
      `)
      .all(accountUuid, TaskType.ONE_TIME, now, TaskTemplateStatus.ACTIVE) as TaskTemplateRow[];

    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 根据目标查找任务（新版本 - 支持 goalUuid 字段）
   */
  async findTasksByGoal(goalUuid: string): Promise<TaskTemplate[]> {
    return this.findByGoal(goalUuid);
  }

  /**
   * 根据关键结果查找任务
   */
  async findTasksByKeyResult(keyResultUuid: string): Promise<TaskTemplate[]> {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM task_templates WHERE (key_result_uuid = ? OR goal_binding_key_result_uuid = ?) AND deleted_at IS NULL ORDER BY created_at DESC')
      .all(keyResultUuid, keyResultUuid) as TaskTemplateRow[];

    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 查找子任务
   */
  async findSubtasks(parentTaskUuid: string): Promise<TaskTemplate[]> {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM task_templates WHERE parent_task_uuid = ? AND deleted_at IS NULL ORDER BY created_at DESC')
      .all(parentTaskUuid) as TaskTemplateRow[];

    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 查找被阻塞的任务
   */
  async findBlockedTasks(accountUuid: string): Promise<TaskTemplate[]> {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM task_templates WHERE account_uuid = ? AND is_blocked = 1 AND deleted_at IS NULL ORDER BY created_at DESC')
      .all(accountUuid) as TaskTemplateRow[];

    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 按优先级排序查找任务
   */
  async findTasksSortedByPriority(accountUuid: string, limit?: number): Promise<TaskTemplate[]> {
    const db = getDatabase();
    let query = `
      SELECT * FROM task_templates 
      WHERE account_uuid = ? AND status = ? AND deleted_at IS NULL 
      ORDER BY 
        CASE importance 
          WHEN 'vital' THEN 1 
          WHEN 'important' THEN 2 
          WHEN 'moderate' THEN 3 
          WHEN 'minor' THEN 4 
          WHEN 'trivial' THEN 5 
        END,
        CASE urgency 
          WHEN 'critical' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          WHEN 'low' THEN 4 
          WHEN 'none' THEN 5 
        END
    `;

    if (limit) {
      query += ` LIMIT ${limit}`;
    }

    const rows = db.prepare(query).all(accountUuid, TaskTemplateStatus.ACTIVE) as TaskTemplateRow[];
    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 查找即将到期的任务（未来N天内）
   */
  async findUpcomingTasks(accountUuid: string, daysAhead: number): Promise<TaskTemplate[]> {
    const db = getDatabase();
    const now = Date.now();
    const futureDate = now + daysAhead * 24 * 60 * 60 * 1000;

    const rows = db
      .prepare(`
        SELECT * FROM task_templates 
        WHERE account_uuid = ? 
          AND task_type = ? 
          AND due_date >= ? 
          AND due_date <= ?
          AND status = ?
          AND deleted_at IS NULL 
        ORDER BY due_date ASC
      `)
      .all(accountUuid, TaskType.ONE_TIME, now, futureDate, TaskTemplateStatus.ACTIVE) as TaskTemplateRow[];

    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 查找今日任务
   */
  async findTodayTasks(accountUuid: string): Promise<TaskTemplate[]> {
    const db = getDatabase();
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;

    const rows = db
      .prepare(`
        SELECT * FROM task_templates 
        WHERE account_uuid = ? 
          AND task_type = ? 
          AND ((start_date >= ? AND start_date <= ?) OR (due_date >= ? AND due_date <= ?))
          AND status = ?
          AND deleted_at IS NULL 
        ORDER BY start_date ASC, due_date ASC
      `)
      .all(accountUuid, TaskType.ONE_TIME, startOfDay, endOfDay, startOfDay, endOfDay, TaskTemplateStatus.ACTIVE) as TaskTemplateRow[];

    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 统计任务数量（按条件）
   */
  async countTasks(accountUuid: string, filters?: TaskFilters): Promise<number> {
    const db = getDatabase();
    let query = 'SELECT COUNT(*) as count FROM task_templates WHERE account_uuid = ? AND deleted_at IS NULL';
    const params: unknown[] = [accountUuid];

    if (filters?.taskType) {
      query += ' AND task_type = ?';
      params.push(filters.taskType);
    }

    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters?.goalUuid) {
      query += ' AND (goal_uuid = ? OR goal_binding_goal_uuid = ?)';
      params.push(filters.goalUuid, filters.goalUuid);
    }

    if (filters?.folderUuid) {
      query += ' AND folder_uuid = ?';
      params.push(filters.folderUuid);
    }

    if (filters?.isBlocked !== undefined) {
      query += ' AND is_blocked = ?';
      params.push(filters.isBlocked ? 1 : 0);
    }

    const result = db.prepare(query).get(...params) as { count: number };
    return result.count;
  }

  /**
   * 批量保存任务
   */
  async saveBatch(templates: TaskTemplate[]): Promise<void> {
    transaction(() => {
      for (const template of templates) {
        // 使用同步方式调用 save 的内部逻辑
        this.saveSync(template);
      }
    });
  }

  /**
   * 批量删除任务
   */
  async deleteBatch(uuids: string[]): Promise<void> {
    const db = getDatabase();
    const placeholders = uuids.map(() => '?').join(', ');
    db.prepare(`DELETE FROM task_templates WHERE uuid IN (${placeholders})`).run(...uuids);
  }

  // ========== 私有辅助方法 ==========

  /**
   * 同步保存任务模板（用于事务）
   */
  private saveSync(template: TaskTemplate): void {
    const db = getDatabase();
    const dto = template.toPersistenceDTO();

    const existing = db
      .prepare('SELECT uuid FROM task_templates WHERE uuid = ?')
      .get(dto.uuid);

    if (existing) {
      db.prepare(`
        UPDATE task_templates SET
          account_uuid = ?,
          title = ?,
          description = ?,
          task_type = ?,
          time_config_type = ?,
          time_config_start_time = ?,
          time_config_end_time = ?,
          time_config_duration_minutes = ?,
          recurrence_rule_type = ?,
          recurrence_rule_interval = ?,
          recurrence_rule_days_of_week = ?,
          recurrence_rule_day_of_month = ?,
          recurrence_rule_month_of_year = ?,
          recurrence_rule_end_date = ?,
          recurrence_rule_count = ?,
          reminder_config_enabled = ?,
          reminder_config_time_offset_minutes = ?,
          reminder_config_unit = ?,
          reminder_config_channel = ?,
          importance = ?,
          urgency = ?,
          goal_binding_goal_uuid = ?,
          goal_binding_key_result_uuid = ?,
          goal_binding_increment_value = ?,
          folder_uuid = ?,
          tags = ?,
          color = ?,
          status = ?,
          last_generated_date = ?,
          generate_ahead_days = ?,
          goal_uuid = ?,
          key_result_uuid = ?,
          parent_task_uuid = ?,
          start_date = ?,
          due_date = ?,
          completed_at = ?,
          estimated_minutes = ?,
          actual_minutes = ?,
          note = ?,
          dependency_status = ?,
          is_blocked = ?,
          blocking_reason = ?,
          updated_at = ?,
          deleted_at = ?
        WHERE uuid = ?
      `).run(
        dto.accountUuid,
        dto.title,
        dto.description,
        dto.taskType,
        dto.timeConfigType,
        dto.timeConfigStartTime,
        dto.timeConfigEndTime,
        dto.timeConfigDurationMinutes,
        dto.recurrenceRuleType,
        dto.recurrenceRuleInterval,
        dto.recurrenceRuleDaysOfWeek,
        dto.recurrenceRuleDayOfMonth,
        dto.recurrenceRuleMonthOfYear,
        dto.recurrenceRuleEndDate,
        dto.recurrenceRuleCount,
        dto.reminderConfigEnabled ? 1 : 0,
        dto.reminderConfigTimeOffsetMinutes,
        dto.reminderConfigUnit,
        dto.reminderConfigChannel,
        dto.importance,
        dto.urgency,
        dto.goalBindingGoalUuid,
        dto.goalBindingKeyResultUuid,
        dto.goalBindingIncrementValue,
        dto.folderUuid,
        dto.tags,
        dto.color,
        dto.status,
        dto.lastGeneratedDate,
        dto.generateAheadDays,
        dto.goalUuid,
        dto.keyResultUuid,
        dto.parentTaskUuid,
        dto.startDate,
        dto.dueDate,
        dto.completedAt,
        dto.estimatedMinutes,
        dto.actualMinutes,
        dto.note,
        dto.dependencyStatus,
        dto.isBlocked ? 1 : 0,
        dto.blockingReason,
        dto.updatedAt,
        dto.deletedAt,
        dto.uuid
      );
    } else {
      db.prepare(`
        INSERT INTO task_templates (
          uuid, account_uuid, title, description, task_type,
          time_config_type, time_config_start_time, time_config_end_time, time_config_duration_minutes,
          recurrence_rule_type, recurrence_rule_interval, recurrence_rule_days_of_week,
          recurrence_rule_day_of_month, recurrence_rule_month_of_year, recurrence_rule_end_date, recurrence_rule_count,
          reminder_config_enabled, reminder_config_time_offset_minutes, reminder_config_unit, reminder_config_channel,
          importance, urgency,
          goal_binding_goal_uuid, goal_binding_key_result_uuid, goal_binding_increment_value,
          folder_uuid, tags, color, status, last_generated_date, generate_ahead_days,
          goal_uuid, key_result_uuid, parent_task_uuid, start_date, due_date, completed_at,
          estimated_minutes, actual_minutes, note,
          dependency_status, is_blocked, blocking_reason,
          created_at, updated_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        dto.uuid,
        dto.accountUuid,
        dto.title,
        dto.description,
        dto.taskType,
        dto.timeConfigType,
        dto.timeConfigStartTime,
        dto.timeConfigEndTime,
        dto.timeConfigDurationMinutes,
        dto.recurrenceRuleType,
        dto.recurrenceRuleInterval,
        dto.recurrenceRuleDaysOfWeek,
        dto.recurrenceRuleDayOfMonth,
        dto.recurrenceRuleMonthOfYear,
        dto.recurrenceRuleEndDate,
        dto.recurrenceRuleCount,
        dto.reminderConfigEnabled ? 1 : 0,
        dto.reminderConfigTimeOffsetMinutes,
        dto.reminderConfigUnit,
        dto.reminderConfigChannel,
        dto.importance,
        dto.urgency,
        dto.goalBindingGoalUuid,
        dto.goalBindingKeyResultUuid,
        dto.goalBindingIncrementValue,
        dto.folderUuid,
        dto.tags,
        dto.color,
        dto.status,
        dto.lastGeneratedDate,
        dto.generateAheadDays,
        dto.goalUuid,
        dto.keyResultUuid,
        dto.parentTaskUuid,
        dto.startDate,
        dto.dueDate,
        dto.completedAt,
        dto.estimatedMinutes,
        dto.actualMinutes,
        dto.note,
        dto.dependencyStatus,
        dto.isBlocked ? 1 : 0,
        dto.blockingReason,
        dto.createdAt,
        dto.updatedAt,
        dto.deletedAt
      );
    }
  }

  /**
   * 根据类型查找任务（内部方法）
   */
  private findTasksByType(accountUuid: string, taskType: TaskType, filters?: TaskFilters): TaskTemplate[] {
    const db = getDatabase();
    let query = 'SELECT * FROM task_templates WHERE account_uuid = ? AND task_type = ? AND deleted_at IS NULL';
    const params: unknown[] = [accountUuid, taskType];

    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters?.goalUuid) {
      query += ' AND (goal_uuid = ? OR goal_binding_goal_uuid = ?)';
      params.push(filters.goalUuid, filters.goalUuid);
    }

    if (filters?.parentTaskUuid) {
      query += ' AND parent_task_uuid = ?';
      params.push(filters.parentTaskUuid);
    }

    if (filters?.isBlocked !== undefined) {
      query += ' AND is_blocked = ?';
      params.push(filters.isBlocked ? 1 : 0);
    }

    if (filters?.folderUuid) {
      query += ' AND folder_uuid = ?';
      params.push(filters.folderUuid);
    }

    if (filters?.dueDateFrom) {
      query += ' AND due_date >= ?';
      params.push(filters.dueDateFrom);
    }

    if (filters?.dueDateTo) {
      query += ' AND due_date <= ?';
      params.push(filters.dueDateTo);
    }

    if (filters?.priority) {
      // Priority filtering based on importance/urgency combination
      if (filters.priority === 'HIGH') {
        query += " AND (importance IN ('vital', 'important') OR urgency IN ('critical', 'high'))";
      } else if (filters.priority === 'MEDIUM') {
        query += " AND importance = 'moderate' AND urgency = 'medium'";
      } else if (filters.priority === 'LOW') {
        query += " AND (importance IN ('minor', 'trivial') OR urgency IN ('low', 'none'))";
      }
    }

    query += ' ORDER BY created_at DESC';

    if (filters?.limit) {
      query += ` LIMIT ${filters.limit}`;
    }

    if (filters?.offset) {
      query += ` OFFSET ${filters.offset}`;
    }

    const rows = db.prepare(query).all(...params) as TaskTemplateRow[];

    // Filter by tags if specified
    let results = rows;
    if (filters?.tags && filters.tags.length > 0) {
      results = rows.filter((row) => {
        const rowTags: string[] = row.tags ? JSON.parse(row.tags) : [];
        return filters.tags!.some((tag) => rowTags.includes(tag));
      });
    }

    return results.map((row) => this.mapToEntity(row));
  }

  /**
   * 将数据库行映射为实体
   */
  private mapToEntity(row: TaskTemplateRow): TaskTemplate {
    const dto: TaskTemplatePersistenceDTO = {
      uuid: row.uuid,
      accountUuid: row.account_uuid,
      title: row.title,
      description: row.description,
      taskType: row.task_type,
      timeConfigType: row.time_config_type,
      timeConfigStartTime: row.time_config_start_time,
      timeConfigEndTime: row.time_config_end_time,
      timeConfigDurationMinutes: row.time_config_duration_minutes,
      recurrenceRuleType: row.recurrence_rule_type,
      recurrenceRuleInterval: row.recurrence_rule_interval,
      recurrenceRuleDaysOfWeek: row.recurrence_rule_days_of_week,
      recurrenceRuleDayOfMonth: row.recurrence_rule_day_of_month,
      recurrenceRuleMonthOfYear: row.recurrence_rule_month_of_year,
      recurrenceRuleEndDate: row.recurrence_rule_end_date,
      recurrenceRuleCount: row.recurrence_rule_count,
      reminderConfigEnabled: row.reminder_config_enabled === 1,
      reminderConfigTimeOffsetMinutes: row.reminder_config_time_offset_minutes,
      reminderConfigUnit: row.reminder_config_unit,
      reminderConfigChannel: row.reminder_config_channel,
      importance: row.importance,
      urgency: row.urgency,
      goalBindingGoalUuid: row.goal_binding_goal_uuid,
      goalBindingKeyResultUuid: row.goal_binding_key_result_uuid,
      goalBindingIncrementValue: row.goal_binding_increment_value,
      folderUuid: row.folder_uuid,
      tags: row.tags ?? '[]',
      color: row.color,
      status: row.status,
      lastGeneratedDate: row.last_generated_date,
      generateAheadDays: row.generate_ahead_days,
      goalUuid: row.goal_uuid,
      keyResultUuid: row.key_result_uuid,
      parentTaskUuid: row.parent_task_uuid,
      startDate: row.start_date,
      dueDate: row.due_date,
      completedAt: row.completed_at,
      estimatedMinutes: row.estimated_minutes,
      actualMinutes: row.actual_minutes,
      note: row.note,
      dependencyStatus: row.dependency_status ?? undefined,
      isBlocked: row.is_blocked === 1,
      blockingReason: row.blocking_reason,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    };

    return TaskTemplate.fromPersistenceDTO(dto);
  }
}

// ========== 类型定义 ==========

interface TaskTemplateRow {
  uuid: string;
  account_uuid: string;
  title: string;
  description: string | null;
  task_type: string;
  time_config_type: string | null;
  time_config_start_time: number | null;
  time_config_end_time: number | null;
  time_config_duration_minutes: number | null;
  recurrence_rule_type: string | null;
  recurrence_rule_interval: number | null;
  recurrence_rule_days_of_week: string | null;
  recurrence_rule_day_of_month: number | null;
  recurrence_rule_month_of_year: number | null;
  recurrence_rule_end_date: number | null;
  recurrence_rule_count: number | null;
  reminder_config_enabled: number | null;
  reminder_config_time_offset_minutes: number | null;
  reminder_config_unit: string | null;
  reminder_config_channel: string | null;
  importance: string;
  urgency: string;
  goal_binding_goal_uuid: string | null;
  goal_binding_key_result_uuid: string | null;
  goal_binding_increment_value: number | null;
  folder_uuid: string | null;
  tags: string | null;
  color: string | null;
  status: string;
  last_generated_date: number | null;
  generate_ahead_days: number | null;
  goal_uuid: string | null;
  key_result_uuid: string | null;
  parent_task_uuid: string | null;
  start_date: number | null;
  due_date: number | null;
  completed_at: number | null;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  note: string | null;
  dependency_status: string | null;
  is_blocked: number | null;
  blocking_reason: string | null;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}
