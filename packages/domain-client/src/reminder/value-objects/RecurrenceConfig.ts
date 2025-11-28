/**
 * RecurrenceConfig 值对象实现 (Client)
 */

import {
  CustomDaysRecurrence,
  DailyRecurrence,
  RecurrenceConfigClient,
  RecurrenceConfigClientDTO,
  RecurrenceConfigServerDTO,
  RecurrenceType,
  WeeklyRecurrence,
} from '@dailyuse/contracts/reminder';

export class RecurrenceConfig implements RecurrenceConfigClient {
  private readonly _type: RecurrenceType;
  private readonly _daily: DailyRecurrence | null;
  private readonly _weekly: WeeklyRecurrence | null;
  private readonly _customDays: CustomDaysRecurrence | null;
  private readonly _displayText: string;

  private constructor(params: {
    type: RecurrenceType;
    daily?: DailyRecurrence | null;
    weekly?: WeeklyRecurrence | null;
    customDays?: CustomDaysRecurrence | null;
    displayText: string;
  }) {
    this._type = params.type;
    this._daily = params.daily ?? null;
    this._weekly = params.weekly ?? null;
    this._customDays = params.customDays ?? null;
    this._displayText = params.displayText;
  }

  // ===== Getters =====
  get type(): RecurrenceType {
    return this._type;
  }

  get daily(): DailyRecurrence | null {
    return this._daily;
  }

  get weekly(): WeeklyRecurrence | null {
    return this._weekly;
  }

  get customDays(): CustomDaysRecurrence | null {
    return this._customDays;
  }

  get displayText(): string {
    return this._displayText;
  }

  // ===== 业务方法 =====
  public equals(other: RecurrenceConfigClient): boolean {
    return (
      this._type === other.type &&
      JSON.stringify(this._daily) === JSON.stringify(other.daily) &&
      JSON.stringify(this._weekly) === JSON.stringify(other.weekly) &&
      JSON.stringify(this._customDays) === JSON.stringify(other.customDays)
    );
  }

  // ===== DTO 转换方法 =====
  public toClientDTO(): RecurrenceConfigClientDTO {
    return {
      type: this._type,
      daily: this._daily,
      weekly: this._weekly,
      customDays: this._customDays,
      displayText: this._displayText,
    };
  }

  public toServerDTO(): RecurrenceConfigServerDTO {
    return {
      type: this._type,
      daily: this._daily,
      weekly: this._weekly,
      customDays: this._customDays,
    };
  }

  // ===== 静态工厂方法 =====
  public static fromClientDTO(dto: RecurrenceConfigClientDTO): RecurrenceConfig {
    return new RecurrenceConfig({
      type: dto.type,
      daily: dto.daily,
      weekly: dto.weekly,
      customDays: dto.customDays,
      displayText: dto.displayText,
    });
  }

  public static fromServerDTO(dto: RecurrenceConfigServerDTO): RecurrenceConfig {
    // 从 ServerDTO 转换，生成 displayText
    let displayText = '';
    if (dto.type === RecurrenceType.DAILY && dto.daily) {
      displayText = dto.daily.interval === 1 ? '每天' : `每 ${dto.daily.interval} 天`;
    } else if (dto.type === RecurrenceType.WEEKLY && dto.weekly) {
      displayText = dto.weekly.interval === 1 ? '每周' : `每 ${dto.weekly.interval} 周`;
    } else if (dto.type === RecurrenceType.CUSTOM_DAYS && dto.customDays) {
      displayText = `自定义 ${dto.customDays.dates.length} 个日期`;
    } else {
      displayText = '未设置';
    }

    return new RecurrenceConfig({
      type: dto.type,
      daily: dto.daily,
      weekly: dto.weekly,
      customDays: dto.customDays,
      displayText,
    });
  }
}

