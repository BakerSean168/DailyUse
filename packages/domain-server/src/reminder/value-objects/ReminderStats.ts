/**
 * ReminderStats 值对象
 * 提醒统计信息 - 不可变值对象
 */

import type {
  ReminderStatsServerDTO,
  ReminderStatsClientDTO,
  ReminderStatsPersistenceDTO,
} from '@dailyuse/contracts/reminder';
import { ValueObject } from '@dailyuse/utils';

/**
 * ReminderStats 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 */
export class ReminderStats extends ValueObject implements ReminderStatsServerDTO {
  public readonly totalTriggers: number;
  public readonly lastTriggeredAt: number | null;

  constructor(params: { totalTriggers: number; lastTriggeredAt?: number | null }) {
    super();

    this.totalTriggers = params.totalTriggers;
    this.lastTriggeredAt = params.lastTriggeredAt ?? null;

    // 确保不可变
    Object.freeze(this);
  }

  /**
   * 创建修改后的新实例
   */
  public with(
    changes: Partial<{
      totalTriggers: number;
      lastTriggeredAt: number | null;
    }>,
  ): ReminderStats {
    return new ReminderStats({
      totalTriggers: changes.totalTriggers ?? this.totalTriggers,
      lastTriggeredAt:
        changes.lastTriggeredAt !== undefined ? changes.lastTriggeredAt : this.lastTriggeredAt,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof ReminderStats)) {
      return false;
    }

    return (
      this.totalTriggers === other.totalTriggers && this.lastTriggeredAt === other.lastTriggeredAt
    );
  }

  /**
   * 转换为 DTO
   */
  public toServerDTO(): ReminderStatsServerDTO {
    return {
      totalTriggers: this.totalTriggers,
      lastTriggeredAt: this.lastTriggeredAt,
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): ReminderStatsClientDTO {
    const totalTriggersText = `已触发 ${this.totalTriggers} 次`;
    let lastTriggeredText: string | undefined = undefined;

    if (this.lastTriggeredAt) {
      const diff = Date.now() - this.lastTriggeredAt;
      const hours = Math.round(diff / 3600000);
      if (hours < 24) {
        lastTriggeredText = `${hours} 小时前`;
      } else {
        lastTriggeredText = `${Math.round(hours / 24)} 天前`;
      }
    }

    return {
      totalTriggers: this.totalTriggers,
      lastTriggeredAt: this.lastTriggeredAt,
      totalTriggersText,
      lastTriggeredText,
    };
  }

  /**
   * 转换为 Persistence DTO（数据库存储格式）
   */
  public toPersistenceDTO(): ReminderStatsPersistenceDTO {
    return {
      total_triggers: this.totalTriggers,
      last_triggered_at: this.lastTriggeredAt,
    };
  }

  /**
   * 从 DTO 创建值对象
   */
  public static fromServerDTO(dto: ReminderStatsServerDTO): ReminderStats {
    return new ReminderStats(dto);
  }
}
