/**
 * DoNotDisturbConfig 值对象
 * 免打扰配置 - 不可变值对象
 */

import type { DoNotDisturbConfigPersistenceDTO, DoNotDisturbConfigServerDTO,
  DoNotDisturbConfigClientDTO
 } from '@dailyuse/contracts/notification';
import { ValueObject } from '@dailyuse/utils';

/**
 * DoNotDisturbConfig 值对象
 */
export class DoNotDisturbConfig extends ValueObject implements DoNotDisturbConfig {
  public readonly enabled: boolean;
  public readonly startTime: string; // 'HH:mm'
  public readonly endTime: string; // 'HH:mm'
  public readonly daysOfWeek: number[]; // 0-6

  constructor(params: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    daysOfWeek: number[];
  }) {
    super();

    this.enabled = params.enabled;
    this.startTime = params.startTime;
    this.endTime = params.endTime;
    this.daysOfWeek = [...params.daysOfWeek]; // 复制数组

    // 确保不可变
    Object.freeze(this);
    Object.freeze(this.daysOfWeek);
  }

  /**
   * 创建修改后的新实例
   */
  public with(
    changes: Partial<{
      enabled: boolean;
      startTime: string;
      endTime: string;
      daysOfWeek: number[];
    }>,
  ): DoNotDisturbConfig {
    return new DoNotDisturbConfig({
      enabled: changes.enabled ?? this.enabled,
      startTime: changes.startTime ?? this.startTime,
      endTime: changes.endTime ?? this.endTime,
      daysOfWeek: changes.daysOfWeek ?? this.daysOfWeek,
    });
  }

  /**
   * 判断指定时间戳是否在免打扰时段内
   */
  public isInPeriod(timestamp: number): boolean {
    if (!this.enabled) {
      return false;
    }

    const date = new Date(timestamp);
    const dayOfWeek = date.getDay();

    // 检查是否在配置的星期内
    if (!this.daysOfWeek.includes(dayOfWeek)) {
      return false;
    }

    // 检查是否在时间段内
    const currentTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

    if (this.startTime <= this.endTime) {
      // 同一天内的时间段，例如 09:00 - 17:00
      return currentTime >= this.startTime && currentTime <= this.endTime;
    } else {
      // 跨天的时间段，例如 22:00 - 08:00
      return currentTime >= this.startTime || currentTime <= this.endTime;
    }
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof DoNotDisturbConfig)) {
      return false;
    }

    return (
      this.enabled === other.enabled &&
      this.startTime === other.startTime &&
      this.endTime === other.endTime &&
      this.daysOfWeek.length === other.daysOfWeek.length &&
      this.daysOfWeek.every((day, index) => day === other.daysOfWeek[index])
    );
  }

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): DoNotDisturbConfigServerDTO {
    return {
      enabled: this.enabled,
      startTime: this.startTime,
      endTime: this.endTime,
      daysOfWeek: [...this.daysOfWeek],
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): DoNotDisturbConfigClientDTO {
    const weekDayNames = ['日', '一', '二', '三', '四', '五', '六'];
    const daysOfWeekText = this.daysOfWeek.map(d => weekDayNames[d]).join('、');
    return {
      enabled: this.enabled,
      startTime: this.startTime,
      endTime: this.endTime,
      daysOfWeek: [...this.daysOfWeek],
      timeRangeText: `${this.startTime} - ${this.endTime}`,
      daysOfWeekText,
      isActive: this.enabled,
    };
  }

  /**
   * 转换为 Persistence DTO
   */
  public toPersistenceDTO(): DoNotDisturbConfigPersistenceDTO {
    return {
      enabled: this.enabled,
      startTime: this.startTime,
      endTime: this.endTime,
      daysOfWeek: JSON.stringify(this.daysOfWeek),
    };
  }

  /**
   * 转换为 Contract 接口 (兼容旧代码)
   */
  public toContract(): DoNotDisturbConfigServerDTO {
    return this.toServerDTO();
  }

  /**
   * 从 Server DTO 创建值对象
   */
  public static fromServerDTO(dto: DoNotDisturbConfigServerDTO): DoNotDisturbConfig {
    return new DoNotDisturbConfig(dto);
  }

  /**
   * 从 Contract 接口创建值对象 (兼容旧代码)
   */
  public static fromContract(config: DoNotDisturbConfigServerDTO): DoNotDisturbConfig {
    return DoNotDisturbConfig.fromServerDTO(config);
  }

  /**
   * 创建默认配置（关闭状态）
   */
  public static createDefault(): DoNotDisturbConfig {
    return new DoNotDisturbConfig({
      enabled: false,
      startTime: '22:00',
      endTime: '08:00',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // 所有天
    });
  }
}
