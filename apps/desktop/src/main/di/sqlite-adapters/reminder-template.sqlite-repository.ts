/**
 * SQLite ReminderTemplate Repository
 *
 * 实现 IReminderTemplateRepository 接口的 SQLite 适配器
 * 遵循 DDD Repository 模式
 */

import type { IReminderTemplateRepository } from '@dailyuse/domain-server/reminder';
import { ReminderTemplate, ReminderHistory } from '@dailyuse/domain-server/reminder';
import type { ReminderTemplatePersistenceDTO, ReminderHistoryPersistenceDTO } from '@dailyuse/contracts/reminder';
import { ReminderStatus, ReminderType, TriggerResult } from '@dailyuse/contracts/reminder';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { getDatabase, transaction } from '../../database';

/**
 * ReminderTemplate SQLite Repository 实现
 */
export class SqliteReminderTemplateRepository implements IReminderTemplateRepository {
  // ============ 基本 CRUD ============

  /**
   * 保存聚合根（创建或更新）
   * 级联保存所有子实体（ReminderHistory）
   */
  async save(template: ReminderTemplate): Promise<void> {
    const db = getDatabase();
    const dto = template.toPersistenceDTO();

    transaction(() => {
      const existing = db
        .prepare('SELECT uuid FROM reminder_templates WHERE uuid = ?')
        .get(dto.uuid);

      if (existing) {
        db.prepare(`
          UPDATE reminder_templates SET
            account_uuid = ?,
            title = ?,
            description = ?,
            type = ?,
            trigger = ?,
            recurrence = ?,
            active_time = ?,
            active_hours = ?,
            notification_config = ?,
            self_enabled = ?,
            status = ?,
            group_uuid = ?,
            importance_level = ?,
            tags = ?,
            color = ?,
            icon = ?,
            next_trigger_at = ?,
            stats = ?,
            click_rate = ?,
            ignore_rate = ?,
            avg_response_time = ?,
            snooze_count = ?,
            effectiveness_score = ?,
            sample_size = ?,
            last_analysis_time = ?,
            original_interval = ?,
            adjusted_interval = ?,
            adjustment_reason = ?,
            adjustment_time = ?,
            is_auto_adjusted = ?,
            user_confirmed = ?,
            smart_frequency_enabled = ?,
            updated_at = ?,
            deleted_at = ?
          WHERE uuid = ?
        `).run(
          dto.accountUuid,
          dto.title,
          dto.description,
          dto.type,
          dto.trigger,
          dto.recurrence,
          dto.activeTime,
          dto.activeHours,
          dto.notificationConfig,
          dto.selfEnabled ? 1 : 0,
          dto.status,
          dto.groupUuid,
          dto.importanceLevel,
          dto.tags,
          dto.color,
          dto.icon,
          dto.nextTriggerAt,
          dto.stats,
          dto.clickRate,
          dto.ignoreRate,
          dto.avgResponseTime,
          dto.snoozeCount,
          dto.effectivenessScore,
          dto.sampleSize,
          dto.lastAnalysisTime,
          dto.originalInterval,
          dto.adjustedInterval,
          dto.adjustmentReason,
          dto.adjustmentTime,
          dto.isAutoAdjusted ? 1 : 0,
          dto.userConfirmed ? 1 : 0,
          dto.smartFrequencyEnabled ? 1 : 0,
          dto.updatedAt,
          dto.deletedAt,
          dto.uuid
        );
      } else {
        db.prepare(`
          INSERT INTO reminder_templates (
            uuid, account_uuid, title, description, type,
            trigger, recurrence, active_time, active_hours, notification_config,
            self_enabled, status, group_uuid, importance_level, tags,
            color, icon, next_trigger_at, stats,
            click_rate, ignore_rate, avg_response_time, snooze_count,
            effectiveness_score, sample_size, last_analysis_time,
            original_interval, adjusted_interval, adjustment_reason, adjustment_time,
            is_auto_adjusted, user_confirmed, smart_frequency_enabled,
            created_at, updated_at, deleted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          dto.uuid,
          dto.accountUuid,
          dto.title,
          dto.description,
          dto.type,
          dto.trigger,
          dto.recurrence,
          dto.activeTime,
          dto.activeHours,
          dto.notificationConfig,
          dto.selfEnabled ? 1 : 0,
          dto.status,
          dto.groupUuid,
          dto.importanceLevel,
          dto.tags,
          dto.color,
          dto.icon,
          dto.nextTriggerAt,
          dto.stats,
          dto.clickRate,
          dto.ignoreRate,
          dto.avgResponseTime,
          dto.snoozeCount,
          dto.effectivenessScore,
          dto.sampleSize,
          dto.lastAnalysisTime,
          dto.originalInterval,
          dto.adjustedInterval,
          dto.adjustmentReason,
          dto.adjustmentTime,
          dto.isAutoAdjusted ? 1 : 0,
          dto.userConfirmed ? 1 : 0,
          dto.smartFrequencyEnabled ? 1 : 0,
          dto.createdAt,
          dto.updatedAt,
          dto.deletedAt
        );
      }

      // 级联保存历史记录
      const history = template.history;
      if (history && history.length > 0) {
        for (const h of history) {
          this.saveHistorySync(h);
        }
      }
    });
  }

  /**
   * 通过 UUID 查找聚合根
   */
  async findById(
    uuid: string,
    options?: { includeHistory?: boolean }
  ): Promise<ReminderTemplate | null> {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM reminder_templates WHERE uuid = ?')
      .get(uuid) as ReminderTemplateRow | undefined;

    if (!row) {
      return null;
    }

    const template = this.mapToEntity(row);

    if (options?.includeHistory) {
      const historyRows = db
        .prepare('SELECT * FROM reminder_history WHERE template_uuid = ? ORDER BY triggered_at DESC')
        .all(uuid) as ReminderHistoryRow[];

      for (const hRow of historyRows) {
        template.addHistory(this.mapHistoryToEntity(hRow));
      }
    }

    return template;
  }

  /**
   * 通过账户 UUID 查找所有提醒模板
   */
  async findByAccountUuid(
    accountUuid: string,
    options?: { includeHistory?: boolean; includeDeleted?: boolean }
  ): Promise<ReminderTemplate[]> {
    const db = getDatabase();
    const includeDeleted = options?.includeDeleted ?? false;

    const query = includeDeleted
      ? 'SELECT * FROM reminder_templates WHERE account_uuid = ? ORDER BY created_at DESC'
      : 'SELECT * FROM reminder_templates WHERE account_uuid = ? AND deleted_at IS NULL ORDER BY created_at DESC';

    const rows = db.prepare(query).all(accountUuid) as ReminderTemplateRow[];
    const templates = rows.map((row) => this.mapToEntity(row));

    if (options?.includeHistory) {
      for (const template of templates) {
        const historyRows = db
          .prepare('SELECT * FROM reminder_history WHERE template_uuid = ? ORDER BY triggered_at DESC')
          .all(template.uuid) as ReminderHistoryRow[];

        for (const hRow of historyRows) {
          template.addHistory(this.mapHistoryToEntity(hRow));
        }
      }
    }

    return templates;
  }

  /**
   * 通过分组 UUID 查找所有提醒模板
   */
  async findByGroupUuid(
    groupUuid: string | null,
    options?: { includeHistory?: boolean; includeDeleted?: boolean }
  ): Promise<ReminderTemplate[]> {
    const db = getDatabase();
    const includeDeleted = options?.includeDeleted ?? false;

    let query: string;
    let params: (string | null)[];

    if (groupUuid === null) {
      query = includeDeleted
        ? 'SELECT * FROM reminder_templates WHERE group_uuid IS NULL ORDER BY created_at DESC'
        : 'SELECT * FROM reminder_templates WHERE group_uuid IS NULL AND deleted_at IS NULL ORDER BY created_at DESC';
      params = [];
    } else {
      query = includeDeleted
        ? 'SELECT * FROM reminder_templates WHERE group_uuid = ? ORDER BY created_at DESC'
        : 'SELECT * FROM reminder_templates WHERE group_uuid = ? AND deleted_at IS NULL ORDER BY created_at DESC';
      params = [groupUuid];
    }

    const rows = db.prepare(query).all(...params) as ReminderTemplateRow[];
    const templates = rows.map((row) => this.mapToEntity(row));

    if (options?.includeHistory) {
      for (const template of templates) {
        const historyRows = db
          .prepare('SELECT * FROM reminder_history WHERE template_uuid = ? ORDER BY triggered_at DESC')
          .all(template.uuid) as ReminderHistoryRow[];

        for (const hRow of historyRows) {
          template.addHistory(this.mapHistoryToEntity(hRow));
        }
      }
    }

    return templates;
  }

  /**
   * 查找所有活跃的提醒模板
   */
  async findActive(accountUuid?: string): Promise<ReminderTemplate[]> {
    const db = getDatabase();

    const query = accountUuid
      ? 'SELECT * FROM reminder_templates WHERE account_uuid = ? AND status = ? AND deleted_at IS NULL ORDER BY next_trigger_at ASC'
      : 'SELECT * FROM reminder_templates WHERE status = ? AND deleted_at IS NULL ORDER BY next_trigger_at ASC';

    const params = accountUuid
      ? [accountUuid, ReminderStatus.ACTIVE]
      : [ReminderStatus.ACTIVE];

    const rows = db.prepare(query).all(...params) as ReminderTemplateRow[];
    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 查找下次触发时间在指定时间之前的提醒模板
   */
  async findByNextTriggerBefore(
    beforeTime: number,
    accountUuid?: string
  ): Promise<ReminderTemplate[]> {
    const db = getDatabase();

    const query = accountUuid
      ? 'SELECT * FROM reminder_templates WHERE account_uuid = ? AND next_trigger_at <= ? AND status = ? AND deleted_at IS NULL ORDER BY next_trigger_at ASC'
      : 'SELECT * FROM reminder_templates WHERE next_trigger_at <= ? AND status = ? AND deleted_at IS NULL ORDER BY next_trigger_at ASC';

    const params = accountUuid
      ? [accountUuid, beforeTime, ReminderStatus.ACTIVE]
      : [beforeTime, ReminderStatus.ACTIVE];

    const rows = db.prepare(query).all(...params) as ReminderTemplateRow[];
    return rows.map((row) => this.mapToEntity(row));
  }

  /**
   * 批量查找提醒模板
   */
  async findByIds(
    uuids: string[],
    options?: { includeHistory?: boolean }
  ): Promise<ReminderTemplate[]> {
    if (uuids.length === 0) {
      return [];
    }

    const db = getDatabase();
    const placeholders = uuids.map(() => '?').join(',');
    const query = `SELECT * FROM reminder_templates WHERE uuid IN (${placeholders})`;

    const rows = db.prepare(query).all(...uuids) as ReminderTemplateRow[];
    const templates = rows.map((row) => this.mapToEntity(row));

    // 保持顺序与传入的 UUID 列表一致
    const templateMap = new Map(templates.map((t) => [t.uuid, t]));
    const orderedTemplates = uuids
      .map((uuid) => templateMap.get(uuid))
      .filter((t): t is ReminderTemplate => t !== undefined);

    if (options?.includeHistory) {
      for (const template of orderedTemplates) {
        const historyRows = db
          .prepare('SELECT * FROM reminder_history WHERE template_uuid = ? ORDER BY triggered_at DESC')
          .all(template.uuid) as ReminderHistoryRow[];

        for (const hRow of historyRows) {
          template.addHistory(this.mapHistoryToEntity(hRow));
        }
      }
    }

    return orderedTemplates;
  }

  /**
   * 删除聚合根
   * 级联删除所有子实体（ReminderHistory）
   */
  async delete(uuid: string): Promise<void> {
    const db = getDatabase();

    transaction(() => {
      // 先删除历史记录
      db.prepare('DELETE FROM reminder_history WHERE template_uuid = ?').run(uuid);
      // 再删除模板
      db.prepare('DELETE FROM reminder_templates WHERE uuid = ?').run(uuid);
    });
  }

  /**
   * 检查提醒模板是否存在
   */
  async exists(uuid: string): Promise<boolean> {
    const db = getDatabase();
    const row = db
      .prepare('SELECT 1 FROM reminder_templates WHERE uuid = ?')
      .get(uuid);
    return !!row;
  }

  /**
   * 统计账户下的提醒模板数量
   */
  async count(
    accountUuid: string,
    options?: { status?: ReminderStatus; includeDeleted?: boolean }
  ): Promise<number> {
    const db = getDatabase();
    const includeDeleted = options?.includeDeleted ?? false;

    let query = 'SELECT COUNT(*) as count FROM reminder_templates WHERE account_uuid = ?';
    const params: (string | ReminderStatus)[] = [accountUuid];

    if (options?.status) {
      query += ' AND status = ?';
      params.push(options.status);
    }

    if (!includeDeleted) {
      query += ' AND deleted_at IS NULL';
    }

    const row = db.prepare(query).get(...params) as { count: number };
    return row.count;
  }

  // ============ 私有方法 ============

  /**
   * 同步保存历史记录（用于事务内）
   */
  private saveHistorySync(history: ReminderHistory): void {
    const db = getDatabase();
    const dto = history.toPersistenceDTO();

    const existing = db
      .prepare('SELECT uuid FROM reminder_history WHERE uuid = ?')
      .get(dto.uuid);

    if (!existing) {
      db.prepare(`
        INSERT INTO reminder_history (
          uuid, template_uuid, triggered_at, result, error,
          notification_sent, notification_channels, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        dto.uuid,
        dto.templateUuid,
        dto.triggeredAt,
        dto.result,
        dto.error,
        dto.notificationSent ? 1 : 0,
        dto.notificationChannels,
        dto.createdAt
      );
    }
  }

  /**
   * 将数据库行映射为实体
   */
  private mapToEntity(row: ReminderTemplateRow): ReminderTemplate {
    return ReminderTemplate.fromPersistenceDTO({
      uuid: row.uuid,
      accountUuid: row.account_uuid,
      title: row.title,
      description: row.description,
      type: row.type as ReminderType,
      trigger: row.trigger,
      recurrence: row.recurrence,
      activeTime: row.active_time,
      activeHours: row.active_hours,
      notificationConfig: row.notification_config,
      selfEnabled: !!row.self_enabled,
      status: row.status as ReminderStatus,
      groupUuid: row.group_uuid,
      importanceLevel: row.importance_level as ImportanceLevel,
      tags: row.tags,
      color: row.color,
      icon: row.icon,
      nextTriggerAt: row.next_trigger_at,
      stats: row.stats,
      clickRate: row.click_rate,
      ignoreRate: row.ignore_rate,
      avgResponseTime: row.avg_response_time,
      snoozeCount: row.snooze_count,
      effectivenessScore: row.effectiveness_score,
      sampleSize: row.sample_size,
      lastAnalysisTime: row.last_analysis_time,
      originalInterval: row.original_interval,
      adjustedInterval: row.adjusted_interval,
      adjustmentReason: row.adjustment_reason,
      adjustmentTime: row.adjustment_time,
      isAutoAdjusted: !!row.is_auto_adjusted,
      userConfirmed: !!row.user_confirmed,
      smartFrequencyEnabled: row.smart_frequency_enabled !== 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    });
  }

  /**
   * 将历史记录数据库行映射为实体
   */
  private mapHistoryToEntity(row: ReminderHistoryRow): ReminderHistory {
    return ReminderHistory.fromPersistenceDTO({
      uuid: row.uuid,
      templateUuid: row.template_uuid,
      triggeredAt: row.triggered_at,
      result: row.result as TriggerResult,
      error: row.error,
      notificationSent: !!row.notification_sent,
      notificationChannels: row.notification_channels,
      createdAt: row.created_at,
    });
  }
}

// ============ 类型定义 ============

interface ReminderTemplateRow {
  uuid: string;
  account_uuid: string;
  title: string;
  description: string | null;
  type: string;
  trigger: string;
  recurrence: string | null;
  active_time: string;
  active_hours: string | null;
  notification_config: string;
  self_enabled: number;
  status: string;
  group_uuid: string | null;
  importance_level: string;
  tags: string;
  color: string | null;
  icon: string | null;
  next_trigger_at: number | null;
  stats: string;
  click_rate: number | null;
  ignore_rate: number | null;
  avg_response_time: number | null;
  snooze_count: number;
  effectiveness_score: number | null;
  sample_size: number;
  last_analysis_time: number | null;
  original_interval: number | null;
  adjusted_interval: number | null;
  adjustment_reason: string | null;
  adjustment_time: number | null;
  is_auto_adjusted: number;
  user_confirmed: number;
  smart_frequency_enabled: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

interface ReminderHistoryRow {
  uuid: string;
  template_uuid: string;
  triggered_at: number;
  result: string;
  error: string | null;
  notification_sent: number;
  notification_channels: string | null;
  created_at: number;
}
