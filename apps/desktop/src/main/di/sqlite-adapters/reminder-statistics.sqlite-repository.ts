/**
 * SQLite ReminderStatistics Repository
 *
 * 实现 IReminderStatisticsRepository 接口的 SQLite 适配器
 * 遵循 DDD Repository 模式
 */

import type { IReminderStatisticsRepository } from '@dailyuse/domain-server/reminder';
import { ReminderStatistics } from '@dailyuse/domain-server/reminder';
import type { ReminderStatisticsPersistenceDTO } from '@dailyuse/contracts/reminder';
import { getDatabase, transaction } from '../../database';

/**
 * ReminderStatistics SQLite Repository 实现
 */
export class SqliteReminderStatisticsRepository implements IReminderStatisticsRepository {
  // ============ 基本 CRUD ============

  /**
   * 保存聚合根（创建或更新）
   */
  async save(statistics: ReminderStatistics): Promise<void> {
    const db = getDatabase();
    const dto = statistics.toPersistenceDTO();

    transaction(() => {
      const existing = db
        .prepare('SELECT account_uuid FROM reminder_statistics WHERE account_uuid = ?')
        .get(dto.accountUuid);

      if (existing) {
        db.prepare(`
          UPDATE reminder_statistics SET
            uuid = ?,
            template_stats = ?,
            group_stats = ?,
            trigger_stats = ?,
            calculated_at = ?
          WHERE account_uuid = ?
        `).run(
          dto.uuid,
          dto.template_stats,
          dto.group_stats,
          dto.trigger_stats,
          dto.calculated_at,
          dto.accountUuid
        );
      } else {
        db.prepare(`
          INSERT INTO reminder_statistics (
            uuid, account_uuid, template_stats, group_stats, trigger_stats, calculated_at
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          dto.uuid,
          dto.accountUuid,
          dto.template_stats,
          dto.group_stats,
          dto.trigger_stats,
          dto.calculated_at
        );
      }
    });
  }

  /**
   * 通过账户 UUID 查找统计记录
   */
  async findByAccountUuid(accountUuid: string): Promise<ReminderStatistics | null> {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM reminder_statistics WHERE account_uuid = ?')
      .get(accountUuid) as ReminderStatisticsRow | undefined;

    if (!row) {
      return null;
    }

    return this.mapToEntity(row);
  }

  /**
   * 通过账户 UUID 查找或创建统计记录
   */
  async findOrCreate(accountUuid: string): Promise<ReminderStatistics> {
    const existing = await this.findByAccountUuid(accountUuid);

    if (existing) {
      return existing;
    }

    // 创建新的空统计
    const newStatistics = ReminderStatistics.create({ accountUuid });
    await this.save(newStatistics);

    return newStatistics;
  }

  /**
   * 删除统计记录
   */
  async delete(accountUuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM reminder_statistics WHERE account_uuid = ?').run(accountUuid);
  }

  /**
   * 检查统计记录是否存在
   */
  async exists(accountUuid: string): Promise<boolean> {
    const db = getDatabase();
    const row = db
      .prepare('SELECT 1 FROM reminder_statistics WHERE account_uuid = ?')
      .get(accountUuid);
    return !!row;
  }

  // ============ 私有方法 ============

  /**
   * 将数据库行映射为实体
   */
  private mapToEntity(row: ReminderStatisticsRow): ReminderStatistics {
    return ReminderStatistics.fromPersistenceDTO({
      uuid: row.uuid,
      accountUuid: row.account_uuid,
      template_stats: row.template_stats,
      group_stats: row.group_stats,
      trigger_stats: row.trigger_stats,
      calculated_at: row.calculated_at,
    });
  }
}

// ============ 类型定义 ============

interface ReminderStatisticsRow {
  uuid: string;
  account_uuid: string;
  template_stats: string;
  group_stats: string;
  trigger_stats: string;
  calculated_at: number;
}
