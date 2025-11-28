/**
 * TriggerConfig 值对象实现 (Client)
 */

import {
  FixedTimeTrigger,
  IntervalTrigger,
  TriggerConfigClient,
  TriggerConfigClientDTO,
  TriggerConfigServerDTO,
  TriggerType,
} from '@dailyuse/contracts/reminder';

export class TriggerConfig implements TriggerConfigClient {
  private readonly _type: TriggerType;
  private readonly _fixedTime: FixedTimeTrigger | null;
  private readonly _interval: IntervalTrigger | null;
  private readonly _displayText: string;

  private constructor(params: {
    type: TriggerType;
    fixedTime?: FixedTimeTrigger | null;
    interval?: IntervalTrigger | null;
    displayText: string;
  }) {
    this._type = params.type;
    this._fixedTime = params.fixedTime ?? null;
    this._interval = params.interval ?? null;
    this._displayText = params.displayText;
  }

  // ===== Getters =====
  get type(): TriggerType {
    return this._type;
  }

  get fixedTime(): FixedTimeTrigger | null {
    return this._fixedTime;
  }

  get interval(): IntervalTrigger | null {
    return this._interval;
  }

  get displayText(): string {
    return this._displayText;
  }

  // ===== 业务方法 =====
  public equals(other: TriggerConfigClient): boolean {
    return (
      this._type === other.type &&
      JSON.stringify(this._fixedTime) === JSON.stringify(other.fixedTime) &&
      JSON.stringify(this._interval) === JSON.stringify(other.interval)
    );
  }

  // ===== DTO 转换方法 =====
  public toClientDTO(): TriggerConfigClientDTO {
    return {
      type: this._type,
      fixedTime: this._fixedTime,
      interval: this._interval,
      displayText: this._displayText,
    };
  }

  public toServerDTO(): TriggerConfigServerDTO {
    return {
      type: this._type,
      fixedTime: this._fixedTime,
      interval: this._interval,
    };
  }

  // ===== 静态工厂方法 =====
  public static fromClientDTO(dto: TriggerConfigClientDTO): TriggerConfig {
    return new TriggerConfig({
      type: dto.type,
      fixedTime: dto.fixedTime,
      interval: dto.interval,
      displayText: dto.displayText,
    });
  }

  public static fromServerDTO(dto: TriggerConfigServerDTO): TriggerConfig {
    // 从 ServerDTO 转换，生成 displayText
    const displayText = dto.fixedTime
      ? `每天 ${dto.fixedTime.time}`
      : dto.interval
      ? `每隔 ${dto.interval.minutes} 分钟`
      : '未设置';

    return new TriggerConfig({
      type: dto.type,
      fixedTime: dto.fixedTime,
      interval: dto.interval,
      displayText,
    });
  }
}
