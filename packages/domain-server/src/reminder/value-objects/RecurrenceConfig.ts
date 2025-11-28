/**
 * RecurrenceConfig 值对象
 * 重复配置 - 不可变值对象
 */

import type { RecurrenceConfigServerDTO, RecurrenceConfigClientDTO, RecurrenceConfigPersistenceDTO, DailyRecurrence, WeeklyRecurrence, CustomDaysRecurrence } from '@dailyuse/contracts/reminder';
import { RecurrenceType, WeekDay } from '@dailyuse/contracts/reminder';
import { ValueObject } from '@dailyuse/utils';

/**
 * RecurrenceConfig 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 * - 可以自由复制和替换
 */
export class RecurrenceConfig extends ValueObject implements RecurrenceConfigServerDTO {
  public readonly type: RecurrenceType;
  public readonly daily: DailyRecurrence | null;
  public readonly weekly: WeeklyRecurrence | null;
  public readonly customDays: CustomDaysRecurrence | null;

  constructor(params: {
    type: RecurrenceType;
    daily?: DailyRecurrence | null;
    weekly?: WeeklyRecurrence | null;
    customDays?: CustomDaysRecurrence | null;
  }) {
    super();

    this.type = params.type;
    this.daily = params.daily ?? null;
    this.weekly = params.weekly
      ? { ...params.weekly, weekDays: [...params.weekly.weekDays] }
      : null;
    this.customDays = params.customDays ? { dates: [...params.customDays.dates] } : null;

    // 确保不可变
    Object.freeze(this);
    if (this.weekly) {
      Object.freeze(this.weekly);
      Object.freeze(this.weekly.weekDays);
    }
    if (this.customDays) {
      Object.freeze(this.customDays);
      Object.freeze(this.customDays.dates);
    }
  }

  /**
   * 创建修改后的新实例（值对象不可变，修改时创建新实例）
   */
  public with(
    changes: Partial<{
      type: RecurrenceType;
      daily: DailyRecurrence | null;
      weekly: WeeklyRecurrence | null;
      customDays: CustomDaysRecurrence | null;
    }>,
  ): RecurrenceConfig {
    return new RecurrenceConfig({
      type: changes.type ?? this.type,
      daily: changes.daily !== undefined ? changes.daily : this.daily,
      weekly: changes.weekly !== undefined ? changes.weekly : this.weekly,
      customDays: changes.customDays !== undefined ? changes.customDays : this.customDays,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof RecurrenceConfig)) {
      return false;
    }

    if (this.type !== other.type) {
      return false;
    }

    // 比较 daily
    if (this.daily !== other.daily) {
      if (!this.daily || !other.daily) return false;
      if (this.daily.interval !== other.daily.interval) return false;
    }

    // 比较 weekly
    if (this.weekly !== other.weekly) {
      if (!this.weekly || !other.weekly) return false;
      if (
        this.weekly.interval !== other.weekly.interval ||
        this.weekly.weekDays.length !== other.weekly.weekDays.length ||
        !this.weekly.weekDays.every(
          (day: WeekDay, idx: number) => day === other.weekly!.weekDays[idx],
        )
      ) {
        return false;
      }
    }

    // 比较 customDays
    if (this.customDays !== other.customDays) {
      if (!this.customDays || !other.customDays) return false;
      if (
        this.customDays.dates.length !== other.customDays.dates.length ||
        !this.customDays.dates.every(
          (date: number, idx: number) => date === other.customDays!.dates[idx],
        )
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * 转换为 DTO
   */
  public toServerDTO(): RecurrenceConfigServerDTO {
    return {
      type: this.type,
      daily: this.daily,
      weekly: this.weekly,
      customDays: this.customDays,
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): RecurrenceConfigClientDTO {
    let displayText = '未配置';
    const weekDayMap: Record<WeekDay, string> = {
      MONDAY: '一',
      TUESDAY: '二',
      WEDNESDAY: '三',
      THURSDAY: '四',
      FRIDAY: '五',
      SATURDAY: '六',
      SUNDAY: '日',
    };

    switch (this.type) {
      case 'DAILY':
        displayText = this.daily?.interval === 1 ? '每天' : `每 ${this.daily?.interval} 天`;
        break;
      case 'WEEKLY':
        if (this.weekly) {
          const days = this.weekly.weekDays.map((d) => weekDayMap[d]).join('、');
          displayText =
            this.weekly.interval === 1 ? `每周 ${days}` : `每 ${this.weekly.interval} 周的 ${days}`;
        }
        break;
      case 'CUSTOM_DAYS':
        displayText = `在 ${this.customDays?.dates.length} 个指定日期`;
        break;
    }

    return {
      type: this.type,
      daily: this.daily,
      weekly: this.weekly,
      customDays: this.customDays,
      displayText,
    };
  }

  /**
   * 转换为 Persistence DTO（数据库存储格式）
   */
  public toPersistenceDTO(): RecurrenceConfigPersistenceDTO {
    return {
      type: this.type,
      daily: this.daily ? JSON.stringify(this.daily) : null,
      weekly: this.weekly ? JSON.stringify(this.weekly) : null,
      custom_days: this.customDays ? JSON.stringify(this.customDays) : null,
    };
  }

  /**
   * 从 DTO 创建值对象
   */
  public static fromServerDTO(dto: RecurrenceConfigServerDTO): RecurrenceConfig {
    return new RecurrenceConfig(dto);
  }
}
