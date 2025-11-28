/**
 * ActiveTimeConfig 值对象实现 (Client)
 */

import type { ActiveTimeConfigClient, ActiveTimeConfigClientDTO, ActiveTimeConfigServerDTO } from '@dailyuse/contracts/reminder';

export class ActiveTimeConfig implements ActiveTimeConfigClient {
  private readonly _startDate: number;
  private readonly _endDate: number | null;
  private readonly _displayText: string;
  private readonly _isActive: boolean;

  private constructor(params: {
    startDate: number;
    endDate?: number | null;
    displayText: string;
    isActive: boolean;
  }) {
    this._startDate = params.startDate;
    this._endDate = params.endDate ?? null;
    this._displayText = params.displayText;
    this._isActive = params.isActive;
  }

  // ===== Getters =====
  get startDate(): number {
    return this._startDate;
  }

  get endDate(): number | null {
    return this._endDate;
  }

  get displayText(): string {
    return this._displayText;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  // ===== 业务方法 =====
  public equals(other: ActiveTimeConfigClient): boolean {
    return (
      this._startDate === other.startDate &&
      this._endDate === other.endDate
    );
  }

  // ===== DTO 转换方法 =====
  public toClientDTO(): ActiveTimeConfigClientDTO {
    return {
      startDate: this._startDate,
      endDate: this._endDate,
      displayText: this._displayText,
      isActive: this._isActive,
    };
  }

  public toServerDTO(): ActiveTimeConfigServerDTO {
    return {
      startDate: this._startDate,
      endDate: this._endDate,
    };
  }

  // ===== 静态工厂方法 =====
  public static fromClientDTO(dto: ActiveTimeConfigClientDTO): ActiveTimeConfig {
    return new ActiveTimeConfig({
      startDate: dto.startDate,
      endDate: dto.endDate,
      displayText: dto.displayText,
      isActive: dto.isActive,
    });
  }

  public static fromServerDTO(dto: ActiveTimeConfigServerDTO): ActiveTimeConfig {
    const now = Date.now();
    const isActive = dto.startDate <= now && (!dto.endDate || dto.endDate >= now);
    
    // 生成 displayText
    const startDateStr = new Date(dto.startDate).toLocaleDateString('zh-CN');
    const displayText = dto.endDate
      ? `${startDateStr} 至 ${new Date(dto.endDate).toLocaleDateString('zh-CN')}`
      : `从 ${startDateStr} 开始`;

    return new ActiveTimeConfig({
      startDate: dto.startDate,
      endDate: dto.endDate,
      displayText,
      isActive,
    });
  }
}
