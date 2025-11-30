/**
 * TriggerConfig 值对象
 * 触发器配置 - 不可变值对象
 */

import type { TriggerConfigServerDTO, TriggerConfigClientDTO, TriggerConfigPersistenceDTO, FixedTimeTrigger, IntervalTrigger } from '@dailyuse/contracts/reminder';
import { TriggerType } from '@dailyuse/contracts/reminder';
import { ValueObject } from '@dailyuse/utils';

/**
 * TriggerConfig 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 */
export class TriggerConfig extends ValueObject implements TriggerConfigServerDTO {
  public readonly type: TriggerType;
  public readonly fixedTime: FixedTimeTrigger | null;
  public readonly interval: IntervalTrigger | null;

  constructor(params: {
    type: TriggerType;
    fixedTime?: FixedTimeTrigger | null;
    interval?: IntervalTrigger | null;
  }) {
    super();

    this.type = params.type;
    this.fixedTime = params.fixedTime ? { ...params.fixedTime } : null;
    this.interval = params.interval ? { ...params.interval } : null;

    // 确保不可变
    Object.freeze(this);
    if (this.fixedTime) Object.freeze(this.fixedTime);
    if (this.interval) Object.freeze(this.interval);
  }

  /**
   * 创建修改后的新实例
   */
  public with(
    changes: Partial<{
      type: TriggerType;
      fixedTime: FixedTimeTrigger | null;
      interval: IntervalTrigger | null;
    }>,
  ): TriggerConfig {
    return new TriggerConfig({
      type: changes.type ?? this.type,
      fixedTime: changes.fixedTime !== undefined ? changes.fixedTime : this.fixedTime,
      interval: changes.interval !== undefined ? changes.interval : this.interval,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof TriggerConfig)) {
      return false;
    }

    return (
      this.type === other.type &&
      JSON.stringify(this.fixedTime) === JSON.stringify(other.fixedTime) &&
      JSON.stringify(this.interval) === JSON.stringify(other.interval)
    );
  }

  /**
   * 转换为 DTO
   */
  public toServerDTO(): TriggerConfigServerDTO {
    return {
      type: this.type,
      fixedTime: this.fixedTime,
      interval: this.interval,
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): TriggerConfigClientDTO {
    let displayText = '未配置';
    if (this.type === 'FIXED_TIME' && this.fixedTime) {
      displayText = `固定时间: ${this.fixedTime.time}`;
    } else if (this.type === 'INTERVAL' && this.interval) {
      displayText = `每隔 ${this.interval.minutes} 分钟`;
    }

    return {
      type: this.type,
      fixedTime: this.fixedTime,
      interval: this.interval,
      displayText,
    };
  }

  /**
   * 转换为 Persistence DTO（数据库存储格式）
   */
  public toPersistenceDTO(): TriggerConfigPersistenceDTO {
    return {
      type: this.type,
      fixed_time: this.fixedTime ? JSON.stringify(this.fixedTime) : null,
      interval: this.interval ? JSON.stringify(this.interval) : null,
    };
  }

  /**
   * 从 DTO 创建值对象
   */
  public static fromServerDTO(dto: TriggerConfigServerDTO): TriggerConfig {
    return new TriggerConfig(dto);
  }
}
