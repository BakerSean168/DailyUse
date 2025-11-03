/**
 * TaskTimeConfig 值对象实现 (Client)
 */

import type { TaskContracts } from '@dailyuse/contracts';
import { ValueObject } from '@dailyuse/utils';

type ITaskTimeConfigClient = TaskContracts.TaskTimeConfigClient;
type TaskTimeConfigClientDTO = TaskContracts.TaskTimeConfigClientDTO;
type TaskTimeConfigServerDTO = TaskContracts.TaskTimeConfigServerDTO;
type TimeType = TaskContracts.TimeType;

export class TaskTimeConfigClient extends ValueObject implements ITaskTimeConfigClient {
  private _timeType: TimeType;
  private _startDate: number | null;
  private _endDate: number | null;
  private _timePoint: number | null;
  private _timeRange: { start: number; end: number } | null;

  private constructor(params: {
    timeType: TimeType;
    startDate?: number | null;
    endDate?: number | null;
    timePoint?: number | null;
    timeRange?: { start: number; end: number } | null;
  }) {
    super();
    this._timeType = params.timeType;
    this._startDate = params.startDate ?? null;
    this._endDate = params.endDate ?? null;
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
  public get endDate(): number | null {
    return this._endDate;
  }
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

  public get formattedEndDate(): string {
    return this._endDate ? new Date(this._endDate).toLocaleDateString() : '';
  }

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
    return this._startDate !== null && this._endDate !== null;
  }

  // 值对象方法
  public equals(other: ITaskTimeConfigClient): boolean {
    return (
      this._timeType === other.timeType &&
      this._startDate === other.startDate &&
      this._endDate === other.endDate &&
      this._timePoint === other.timePoint &&
      JSON.stringify(this._timeRange) === JSON.stringify(other.timeRange)
    );
  }

  // DTO 转换
  public toServerDTO(): TaskTimeConfigServerDTO {
    return {
      timeType: this._timeType,
      startDate: this._startDate,
      endDate: this._endDate,
      timePoint: this._timePoint,
      timeRange: this._timeRange ? { ...this._timeRange } : null,
    };
  }

  public toClientDTO(): TaskTimeConfigClientDTO {
    return {
      timeType: this._timeType,
      startDate: this._startDate,
      endDate: this._endDate,
      timePoint: this._timePoint,
      timeRange: this._timeRange ? { ...this._timeRange } : null,
      timeTypeText: this.timeTypeText,
      formattedStartDate: this.formattedStartDate,
      formattedEndDate: this.formattedEndDate,
      formattedTimePoint: this.formattedTimePoint,
      formattedTimeRange: this.formattedTimeRange,
      displayText: this.displayText,
      hasDateRange: this.hasDateRange,
    };
  }

  // 静态工厂方法
  public static fromClientDTO(dto: TaskTimeConfigClientDTO): TaskTimeConfigClient {
    return new TaskTimeConfigClient({
      timeType: dto.timeType,
      startDate: dto.startDate,
      endDate: dto.endDate,
      timePoint: dto.timePoint,
      timeRange: dto.timeRange,
    });
  }

  public static fromServerDTO(dto: TaskTimeConfigServerDTO): TaskTimeConfigClient {
    return new TaskTimeConfigClient({
      timeType: dto.timeType,
      startDate: dto.startDate,
      endDate: dto.endDate,
      timePoint: dto.timePoint,
      timeRange: dto.timeRange,
    });
  }
}
