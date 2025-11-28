/**
 * ActiveHoursConfig 值对象实现 (Client)
 */

import { ActiveHoursConfigClient, ActiveHoursConfigClientDTO, ActiveHoursConfigServerDTO } from '@dailyuse/contracts/reminder';

export class ActiveHoursConfig implements ActiveHoursConfigClient {
  private readonly _enabled: boolean;
  private readonly _startHour: number;
  private readonly _endHour: number;
  private readonly _displayText: string;

  private constructor(params: {
    enabled: boolean;
    startHour: number;
    endHour: number;
    displayText: string;
  }) {
    this._enabled = params.enabled;
    this._startHour = params.startHour;
    this._endHour = params.endHour;
    this._displayText = params.displayText;
  }

  // ===== Getters =====
  get enabled(): boolean {
    return this._enabled;
  }

  get startHour(): number {
    return this._startHour;
  }

  get endHour(): number {
    return this._endHour;
  }

  get displayText(): string {
    return this._displayText;
  }

  // ===== 业务方法 =====
  public equals(other: ActiveHoursConfigClient): boolean {
    return (
      this._enabled === other.enabled &&
      this._startHour === other.startHour &&
      this._endHour === other.endHour
    );
  }

  // ===== DTO 转换方法 =====
  public toClientDTO(): ActiveHoursConfigClientDTO {
    return {
      enabled: this._enabled,
      startHour: this._startHour,
      endHour: this._endHour,
      displayText: this._displayText,
    };
  }

  public toServerDTO(): ActiveHoursConfigServerDTO {
    return {
      enabled: this._enabled,
      startHour: this._startHour,
      endHour: this._endHour,
    };
  }

  // ===== 静态工厂方法 =====
  public static fromClientDTO(dto: ActiveHoursConfigClientDTO): ActiveHoursConfig {
    return new ActiveHoursConfig({
      enabled: dto.enabled,
      startHour: dto.startHour,
      endHour: dto.endHour,
      displayText: dto.displayText,
    });
  }

  public static fromServerDTO(dto: ActiveHoursConfigServerDTO): ActiveHoursConfig {
    // 生成 displayText
    const displayText = dto.enabled
      ? `${String(dto.startHour).padStart(2, '0')}:00 - ${String(dto.endHour).padStart(2, '0')}:00`
      : '全天';

    return new ActiveHoursConfig({
      enabled: dto.enabled,
      startHour: dto.startHour,
      endHour: dto.endHour,
      displayText,
    });
  }
}
