/**
 * ActiveHoursConfig 值对象
 * 活跃时间段配置 - 不可变值对象
 */

import type {
  ActiveHoursConfigServerDTO,
  ActiveHoursConfigClientDTO,
  ActiveHoursConfigPersistenceDTO,
} from '@dailyuse/contracts/reminder';
import { ValueObject } from '@dailyuse/utils';

/**
 * ActiveHoursConfig 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 */
export class ActiveHoursConfig extends ValueObject implements ActiveHoursConfigServerDTO {
  public readonly enabled: boolean;
  public readonly startHour: number;
  public readonly endHour: number;

  constructor(params: { enabled: boolean; startHour: number; endHour: number }) {
    super();

    this.enabled = params.enabled;
    this.startHour = params.startHour;
    this.endHour = params.endHour;

    // 确保不可变
    Object.freeze(this);
  }

  /**
   * 创建修改后的新实例
   */
  public with(
    changes: Partial<{
      enabled: boolean;
      startHour: number;
      endHour: number;
    }>,
  ): ActiveHoursConfig {
    return new ActiveHoursConfig({
      enabled: changes.enabled ?? this.enabled,
      startHour: changes.startHour ?? this.startHour,
      endHour: changes.endHour ?? this.endHour,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof ActiveHoursConfig)) {
      return false;
    }

    return (
      this.enabled === other.enabled &&
      this.startHour === other.startHour &&
      this.endHour === other.endHour
    );
  }

  /**
   * 转换为 DTO
   */
  public toServerDTO(): ActiveHoursConfigServerDTO {
    return {
      enabled: this.enabled,
      startHour: this.startHour,
      endHour: this.endHour,
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): ActiveHoursConfigClientDTO {
    const displayText = this.enabled
      ? `${String(this.startHour).padStart(2, '0')}:00 - ${String(this.endHour).padStart(2, '0')}:00`
      : '全天';

    return {
      enabled: this.enabled,
      startHour: this.startHour,
      endHour: this.endHour,
      displayText,
    };
  }

  /**
   * 转换为 Persistence DTO（数据库存储格式）
   */
  public toPersistenceDTO(): ActiveHoursConfigPersistenceDTO {
    return {
      enabled: this.enabled,
      start_hour: this.startHour,
      end_hour: this.endHour,
    };
  }

  /**
   * 从 DTO 创建值对象
   */
  public static fromServerDTO(dto: ActiveHoursConfigServerDTO): ActiveHoursConfig {
    return new ActiveHoursConfig(dto);
  }
}
