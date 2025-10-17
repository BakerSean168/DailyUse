/**
 * TaskTimeConfig 值对象 (Server)
 * 任务时间配置 - 不可变值对象
 */

import type { TaskContracts } from '@dailyuse/contracts';
import { ValueObject } from '@dailyuse/utils';

type ITaskTimeConfig = TaskContracts.TaskTimeConfigServerDTO;
type TimeType = TaskContracts.TimeType;

/**
 * TaskTimeConfig 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 * - 可以自由复制和替换
 */
export class TaskTimeConfig extends ValueObject implements ITaskTimeConfig {
  public readonly timeType: TimeType;
  public readonly startDate: number | null;
  public readonly endDate: number | null;
  public readonly timePoint: number | null;
  public readonly timeRange: { start: number; end: number } | null;

  constructor(params: {
    timeType: TimeType;
    startDate?: number | null;
    endDate?: number | null;
    timePoint?: number | null;
    timeRange?: { start: number; end: number } | null;
  }) {
    super();

    this.timeType = params.timeType;
    this.startDate = params.startDate ?? null;
    this.endDate = params.endDate ?? null;
    this.timePoint = params.timePoint ?? null;
    this.timeRange = params.timeRange ? { ...params.timeRange } : null;

    // 确保不可变
    Object.freeze(this);
    if (this.timeRange) {
      Object.freeze(this.timeRange);
    }
  }

  /**
   * 创建修改后的新实例（值对象不可变，修改时创建新实例）
   */
  public with(
    changes: Partial<{
      timeType: TimeType;
      startDate: number | null;
      endDate: number | null;
      timePoint: number | null;
      timeRange: { start: number; end: number } | null;
    }>,
  ): TaskTimeConfig {
    return new TaskTimeConfig({
      timeType: changes.timeType ?? this.timeType,
      startDate: changes.startDate ?? this.startDate,
      endDate: changes.endDate ?? this.endDate,
      timePoint: changes.timePoint ?? this.timePoint,
      timeRange: changes.timeRange ?? this.timeRange,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: TaskTimeConfig): boolean {
    if (!(other instanceof TaskTimeConfig)) {
      return false;
    }

    const timeRangeEqual =
      (this.timeRange === null && other.timeRange === null) ||
      (this.timeRange !== null &&
        other.timeRange !== null &&
        this.timeRange.start === other.timeRange.start &&
        this.timeRange.end === other.timeRange.end);

    return (
      this.timeType === other.timeType &&
      this.startDate === other.startDate &&
      this.endDate === other.endDate &&
      this.timePoint === other.timePoint &&
      timeRangeEqual
    );
  }

  /**
   * DTO 转换
   */
  public toServerDTO(): TaskContracts.TaskTimeConfigServerDTO {
    return {
      timeType: this.timeType,
      startDate: this.startDate,
      endDate: this.endDate,
      timePoint: this.timePoint,
      timeRange: this.timeRange ? { ...this.timeRange } : null,
    };
  }

  public toClientDTO(): TaskContracts.TaskTimeConfigClientDTO {
    return {
      timeType: this.timeType,
      startDate: this.startDate,
      endDate: this.endDate,
      timePoint: this.timePoint,
      timeRange: this.timeRange ? { ...this.timeRange } : null,
      timeTypeText: this.getTimeTypeText(),
      formattedStartDate: this.getFormattedStartDate(),
      formattedEndDate: this.getFormattedEndDate(),
      formattedTimePoint: this.getFormattedTimePoint(),
      formattedTimeRange: this.getFormattedTimeRange(),
      displayText: this.getDisplayText(),
      hasDateRange: this.startDate !== null && this.endDate !== null,
    };
  }

  public toPersistenceDTO(): TaskContracts.TaskTimeConfigPersistenceDTO {
    return {
      timeType: this.timeType,
      startDate: this.startDate,
      endDate: this.endDate,
      timePoint: this.timePoint,
      timeRange: this.timeRange ? JSON.stringify(this.timeRange) : null,
    };
  }

  /**
   * 静态工厂方法
   */
  public static fromServerDTO(dto: TaskContracts.TaskTimeConfigServerDTO): TaskTimeConfig {
    return new TaskTimeConfig({
      timeType: dto.timeType,
      startDate: dto.startDate,
      endDate: dto.endDate,
      timePoint: dto.timePoint,
      timeRange: dto.timeRange,
    });
  }

  public static fromPersistenceDTO(
    dto: TaskContracts.TaskTimeConfigPersistenceDTO,
  ): TaskTimeConfig {
    return new TaskTimeConfig({
      timeType: dto.timeType as TimeType,
      startDate: dto.startDate,
      endDate: dto.endDate,
      timePoint: dto.timePoint,
      timeRange: dto.timeRange ? JSON.parse(dto.timeRange) : null,
    });
  }

  /**
   * 辅助方法（用于 ClientDTO）
   */
  private getTimeTypeText(): string {
    const map: Record<TimeType, string> = {
      ALL_DAY: '全天',
      TIME_POINT: '时间点',
      TIME_RANGE: '时间段',
    };
    return map[this.timeType];
  }

  private getFormattedStartDate(): string {
    return this.startDate ? new Date(this.startDate).toLocaleDateString() : '';
  }

  private getFormattedEndDate(): string {
    return this.endDate ? new Date(this.endDate).toLocaleDateString() : '';
  }

  private getFormattedTimePoint(): string {
    return this.timePoint ? new Date(this.timePoint).toLocaleString() : '';
  }

  private getFormattedTimeRange(): string {
    if (!this.timeRange) return '';
    const start = new Date(this.timeRange.start).toLocaleTimeString();
    const end = new Date(this.timeRange.end).toLocaleTimeString();
    return `${start} - ${end}`;
  }

  private getDisplayText(): string {
    switch (this.timeType) {
      case 'ALL_DAY':
        return '全天';
      case 'TIME_POINT':
        return this.getFormattedTimePoint();
      case 'TIME_RANGE':
        return this.getFormattedTimeRange();
      default:
        return '无时间';
    }
  }
}
