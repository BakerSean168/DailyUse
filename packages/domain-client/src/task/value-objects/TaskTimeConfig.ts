/**
 * TaskTimeConfig 值对象实现 (Client)
 */

import type { TaskTimeConfigClient, TaskTimeConfigClientDTO, TaskTimeConfigServerDTO } from '@dailyuse/contracts/task';
import { TimeType } from '@dailyuse/contracts/task';
import { ValueObject } from '@dailyuse/utils';

export class TaskTimeConfig extends ValueObject implements TaskTimeConfig {
  private _timeType: TimeType;
  private _startDate: number | null;
  // _endDate 已移除 - 结束日期属于重复规则
  private _timePoint: number | null;
  private _timeRange: { start: number; end: number } | null;

  private constructor(params: {
    timeType: TimeType;
    startDate?: number | null;
    timePoint?: number | null;
    timeRange?: { start: number; end: number } | null;
  }) {
    super();
    this._timeType = params.timeType;
    this._startDate = params.startDate ?? null;
    // _endDate 已移除
    this._timePoint = params.timePoint ?? null;
    this._timeRange = params.timeRange ?? null;
  }

  // Getters
  public get timeType(): TimeType {
    return this._timeType;
  }
  public get startDate(): number | null {
    return this._startDate;
  }
  // endDate getter 已移除
  public get timePoint(): number | null {
    return this._timePoint;
  }
  public get timeRange(): { start: number; end: number } | null {
    return this._timeRange ? { ...this._timeRange } : null;
  }

  // UI 辅助属性
  public get timeTypeText(): string {
    const map: Record<TimeType, string> = {
      ALL_DAY: '全天',
      TIME_POINT: '时间点',
      TIME_RANGE: '时间段',
    };
    return map[this._timeType];
  }

  public get formattedStartDate(): string {
    return this._startDate ? new Date(this._startDate).toLocaleDateString() : '';
  }

  // formattedEndDate 已移除

  public get formattedTimePoint(): string {
    return this._timePoint ? new Date(this._timePoint).toLocaleString() : '';
  }

  public get formattedTimeRange(): string {
    if (!this._timeRange) return '';
    const start = new Date(this._timeRange.start).toLocaleTimeString();
    const end = new Date(this._timeRange.end).toLocaleTimeString();
    return `${start} - ${end}`;
  }

  public get displayText(): string {
    switch (this._timeType) {
      case 'ALL_DAY':
        return '全天';
      case 'TIME_POINT':
        return this.formattedTimePoint;
      case 'TIME_RANGE':
        return this.formattedTimeRange;
      default:
        return '无时间';
    }
  }

  public get hasDateRange(): boolean {
    return this._timeRange !== null; // 指的是 timeRange 有开始和结束时间
  }

  // 值对象方法
  public equals(other: TaskTimeConfigClient): boolean {
    return (
      this._timeType === other.timeType &&
      this._startDate === other.startDate &&
      // _endDate 已移除
      this._timePoint === other.timePoint &&
      JSON.stringify(this._timeRange) === JSON.stringify(other.timeRange)
    );
  }

  // DTO 转换
  public toServerDTO(): TaskTimeConfigServerDTO {
    return {
      timeType: this._timeType,
      startDate: this._startDate,
      // endDate 已移除
      timePoint: this._timePoint,
      timeRange: this._timeRange ? { ...this._timeRange } : null,
    };
  }

  public toClientDTO(): TaskTimeConfigClientDTO {
    return {
      timeType: this._timeType,
      startDate: this._startDate,
      // endDate 已移除
      timePoint: this._timePoint,
      timeRange: this._timeRange ? { ...this._timeRange } : null,
      timeTypeText: this.timeTypeText,
      formattedStartDate: this.formattedStartDate,
      // formattedEndDate 已移除
      formattedTimePoint: this.formattedTimePoint,
      formattedTimeRange: this.formattedTimeRange,
      displayText: this.displayText,
      hasDateRange: this.hasDateRange,
    };
  }

  // 静态工厂方法
  public static fromClientDTO(dto: TaskTimeConfigClientDTO): TaskTimeConfig {
    return new TaskTimeConfig({
      timeType: dto.timeType,
      startDate: dto.startDate,
      // endDate 已移除
      timePoint: dto.timePoint,
      timeRange: dto.timeRange,
    });
  }

  public static fromServerDTO(dto: TaskTimeConfigServerDTO): TaskTimeConfig {
    return new TaskTimeConfig({
      timeType: dto.timeType,
      startDate: dto.startDate,
      // endDate 已移除
      timePoint: dto.timePoint,
      timeRange: dto.timeRange,
    });
  }
}
